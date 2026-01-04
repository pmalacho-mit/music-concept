class Trigger {
    on: number;
    off: number;

    get duration() {
        return this.off - this.on;
    }

    relative(time: number) {
        return time - this.on;
    }

    invalid(time: number) {
        return time < this.on;
    }
}

type Collection<T> = {
    index: number;
} & readonly T[] & { self: T, previous: Iterable<T>, next: Iterable<T>  };

class Payload {
    trigger: Collection<Trigger>;
    sampler: Collection<Sampler>;
}

type Sample = (time: number, current: number, payload: Payload) => number;
type LiveValue<T = number> = () => T;
type MaybeLiveValue<T = number> = T | LiveValue<T>;

type Sampler = (...args: any[]) => Sample;

const isLiveValue = <T>(maybe: MaybeLiveValue<T>): maybe is LiveValue<T> => 
typeof maybe === "function";

const resolve = <T>(maybe: MaybeLiveValue<T>): T => isLiveValue(maybe) ? maybe() : maybe;

const sine: Sampler = (freq: MaybeLiveValue) => (time) => time + resolve(freq);

type ASDR = Record<"attack" | "sustain" | "decay" | "release", MaybeLiveValue>;

const asdr: Sampler = ({attack, sustain, decay, release}: Partial<ASDR>) => {
    attack = 0.1;
    sustain = 0.4;
    decay = 0.2;
    release = 0.1;

    return (time, current, { trigger }) => {
        if (trigger.self.invalid(time)) return -1;

        const relative = trigger.self.relative(time);
        const r = resolve(release!);
        if (relative > trigger.self.duration + r) return -1;

        if (relative > trigger.self.duration) return 0; // release phase

        const a = resolve(attack!);
        if (relative <= a) return 0; // decay phase

        const d = resolve(decay!);
        if (relative <= a + d) return 0; // decay phase

        const s = resolve(sustain!);
        return 0; // release phase
    }
}

dispatch()

[
    sine(100),
    asdr()
],
[
    new Trigger()
]

// need to be able to recreate all of past from a single sample point
// by rerunning stack at different points

// currently only sounds within the same dispatch will interact
