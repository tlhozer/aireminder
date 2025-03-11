interface DeviceMotionEvent extends Event {
  readonly accelerationIncludingGravity: {
    readonly x: number | null;
    readonly y: number | null;
    readonly z: number | null;
  } | null;
  readonly acceleration: {
    readonly x: number | null;
    readonly y: number | null;
    readonly z: number | null;
  } | null;
  readonly rotationRate: {
    readonly alpha: number | null;
    readonly beta: number | null;
    readonly gamma: number | null;
  } | null;
  readonly interval: number | null;
}

interface DeviceMotionEventStatic extends EventTarget {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface Window {
  DeviceMotionEvent: DeviceMotionEventStatic & {
    prototype: DeviceMotionEvent;
    new(type: string, eventInitDict?: DeviceMotionEventInit): DeviceMotionEvent;
  };
} 