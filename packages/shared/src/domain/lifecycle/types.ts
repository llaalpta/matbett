export type LifecycleReason = {
  code: string;
  message: string;
};

export type LifecycleStatusOption<TStatus extends string> = {
  value: TStatus;
  label: string;
  enabled: boolean;
  reasons: LifecycleReason[];
};

export type LifecycleActionPolicy = {
  supported: boolean;
  enabled: boolean;
  reasons: LifecycleReason[];
};

export type LifecycleWarning = LifecycleReason;
