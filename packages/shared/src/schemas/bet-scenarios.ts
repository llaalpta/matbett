export const scenarioIds = [
  'SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO_UNMATCHED',
  'SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET_UNMATCHED',
  'SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET_UNMATCHED',
  'SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO',
  'SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET',
  'SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
  'SINGLE_MATCHED_BETTING_STANDARD_PREPAYMENT',
  'SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO',
  'SINGLE_MATCHED_BETTING_UNDERLAY_USE_FREEBET',
  'SINGLE_MATCHED_BETTING_UNDERLAY_GENERATE_FREEBET',
  'SINGLE_MATCHED_BETTING_UNDERLAY_PREPAYMENT',
  'SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO',
  'SINGLE_MATCHED_BETTING_OVERLAY_USE_FREEBET',
  'SINGLE_MATCHED_BETTING_OVERLAY_GENERATE_FREEBET',
  'SINGLE_MATCHED_BETTING_OVERLAY_PREPAYMENT',
  'SINGLE_DUTCHING_2_OPTIONS_STANDARD_NO_PROMO',
  'SINGLE_DUTCHING_2_OPTIONS_STANDARD_USE_FREEBET',
  'SINGLE_DUTCHING_2_OPTIONS_STANDARD_GENERATE_FREEBET',
  'SINGLE_DUTCHING_2_OPTIONS_STANDARD_PREPAYMENT',
  'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_NO_PROMO',
  'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_USE_FREEBET',
  'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_PREPAYMENT',
  'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_USE_FREEBET',
  'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_NO_PROMO',
  'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_PREPAYMENT',
  'SINGLE_DUTCHING_3_OPTIONS_STANDARD_NO_PROMO',
  'SINGLE_DUTCHING_3_OPTIONS_STANDARD_USE_FREEBET',
  'SINGLE_DUTCHING_3_OPTIONS_STANDARD_GENERATE_FREEBET',
  'SINGLE_DUTCHING_3_OPTIONS_UNDERLAY_NO_PROMO',
  'COMBINED_2_DUTCHING_STANDARD_NO_PROMO',
  'COMBINED_2_DUTCHING_STANDARD_USE_FREEBET',
  'COMBINED_2_DUTCHING_STANDARD_GENERATE_FREEBET',
  'COMBINED_2_MATCHED_BETTING_STANDARD_NO_PROMO',
  'COMBINED_2_MATCHED_BETTING_STANDARD_USE_FREEBET',
  'COMBINED_2_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
  'COMBINED_3_MATCHED_BETTING_STANDARD_NO_PROMO',
  'COMBINED_3_MATCHED_BETTING_STANDARD_USE_FREEBET',
  'COMBINED_3_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
  'COMBINED_3_DUTCHING_STANDARD_NO_PROMO',
  'COMBINED_3_DUTCHING_STANDARD_USE_FREEBET',
  'COMBINED_3_DUTCHING_STANDARD_GENERATE_FREEBET',
] as const;

export const scenarioPromoActions = [
  'NO_PROMO',
  'GENERATE_FREEBET',
  'USE_FREEBET',
] as const;

export type ScenarioId = (typeof scenarioIds)[number];
export type ScenarioPromoAction = (typeof scenarioPromoActions)[number];

export type ScenarioStrategyType = 'MATCHED_BETTING' | 'DUTCHING';
export type ScenarioLineMode = 'SINGLE' | 'COMBINED_2' | 'COMBINED_3';
export type ScenarioMode = 'STANDARD' | 'OVERLAY' | 'UNDERLAY';
export type ScenarioLegRole = 'MAIN' | 'HEDGE1' | 'HEDGE2' | 'HEDGE3';
export type ScenarioHedgeAdjustmentType = 'UNMATCHED' | 'PREPAYMENT';

export type ScenarioDescriptor = {
  id: ScenarioId;
  lineMode: ScenarioLineMode;
  strategyType: ScenarioStrategyType;
  mode: ScenarioMode;
  promoAction: ScenarioPromoAction;
  expectedLegRoles: readonly ScenarioLegRole[];
  dutchingOptionsCount?: 2 | 3;
  hedgeAdjustmentType?: ScenarioHedgeAdjustmentType;
};

const scenarioDescriptors: readonly ScenarioDescriptor[] = [
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO_UNMATCHED',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'UNMATCHED',
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET_UNMATCHED',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'UNMATCHED',
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET_UNMATCHED',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'UNMATCHED',
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_STANDARD_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'UNDERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_UNDERLAY_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'UNDERLAY',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_UNDERLAY_GENERATE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'UNDERLAY',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_UNDERLAY_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'UNDERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'OVERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_OVERLAY_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'OVERLAY',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_OVERLAY_GENERATE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'OVERLAY',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
  },
  {
    id: 'SINGLE_MATCHED_BETTING_OVERLAY_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'MATCHED_BETTING',
    mode: 'OVERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_STANDARD_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_STANDARD_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_STANDARD_GENERATE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_STANDARD_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 2,
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'UNDERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'UNDERLAY',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_UNDERLAY_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'UNDERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 2,
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'OVERLAY',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'OVERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1'],
    dutchingOptionsCount: 2,
  },
  {
    id: 'SINGLE_DUTCHING_2_OPTIONS_OVERLAY_PREPAYMENT',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'OVERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 2,
    hedgeAdjustmentType: 'PREPAYMENT',
  },
  {
    id: 'SINGLE_DUTCHING_3_OPTIONS_STANDARD_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 3,
  },
  {
    id: 'SINGLE_DUTCHING_3_OPTIONS_STANDARD_USE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 3,
  },
  {
    id: 'SINGLE_DUTCHING_3_OPTIONS_STANDARD_GENERATE_FREEBET',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 3,
  },
  {
    id: 'SINGLE_DUTCHING_3_OPTIONS_UNDERLAY_NO_PROMO',
    lineMode: 'SINGLE',
    strategyType: 'DUTCHING',
    mode: 'UNDERLAY',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
    dutchingOptionsCount: 3,
  },
  {
    id: 'COMBINED_2_DUTCHING_STANDARD_NO_PROMO',
    lineMode: 'COMBINED_2',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_2_DUTCHING_STANDARD_USE_FREEBET',
    lineMode: 'COMBINED_2',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_2_DUTCHING_STANDARD_GENERATE_FREEBET',
    lineMode: 'COMBINED_2',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_2_MATCHED_BETTING_STANDARD_NO_PROMO',
    lineMode: 'COMBINED_2',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_2_MATCHED_BETTING_STANDARD_USE_FREEBET',
    lineMode: 'COMBINED_2',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_2_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
    lineMode: 'COMBINED_2',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2'],
  },
  {
    id: 'COMBINED_3_MATCHED_BETTING_STANDARD_NO_PROMO',
    lineMode: 'COMBINED_3',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
  {
    id: 'COMBINED_3_MATCHED_BETTING_STANDARD_USE_FREEBET',
    lineMode: 'COMBINED_3',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
  {
    id: 'COMBINED_3_MATCHED_BETTING_STANDARD_GENERATE_FREEBET',
    lineMode: 'COMBINED_3',
    strategyType: 'MATCHED_BETTING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
  {
    id: 'COMBINED_3_DUTCHING_STANDARD_NO_PROMO',
    lineMode: 'COMBINED_3',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'NO_PROMO',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
  {
    id: 'COMBINED_3_DUTCHING_STANDARD_USE_FREEBET',
    lineMode: 'COMBINED_3',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'USE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
  {
    id: 'COMBINED_3_DUTCHING_STANDARD_GENERATE_FREEBET',
    lineMode: 'COMBINED_3',
    strategyType: 'DUTCHING',
    mode: 'STANDARD',
    promoAction: 'GENERATE_FREEBET',
    expectedLegRoles: ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'],
  },
] as const;

export const scenarioCatalog = new Map<ScenarioId, ScenarioDescriptor>(
  scenarioDescriptors.map((descriptor) => [descriptor.id, descriptor]),
);

export type GetScenarioIdInput = {
  strategyType: ScenarioStrategyType;
  lineMode: ScenarioLineMode;
  mode: ScenarioMode;
  promoAction: ScenarioPromoAction;
  dutchingOptionsCount?: 2 | 3;
  hedgeAdjustmentType?: ScenarioHedgeAdjustmentType;
};

export type ScenarioAvailabilityOperation = 'create' | 'update';

export type ScenarioAvailabilityInput = {
  operation?: ScenarioAvailabilityOperation;
  strategyType?: ScenarioStrategyType;
  lineMode?: ScenarioLineMode;
  mode?: ScenarioMode;
  promoAction?: ScenarioPromoAction;
  dutchingOptionsCount?: 2 | 3;
  hedgeAdjustmentType?: ScenarioHedgeAdjustmentType;
};

export type ScenarioAvailability = {
  scenarios: readonly ScenarioDescriptor[];
  strategyTypes: readonly ScenarioStrategyType[];
  lineModes: readonly ScenarioLineMode[];
  modes: readonly ScenarioMode[];
  promoActions: readonly ScenarioPromoAction[];
  dutchingOptionsCounts: readonly (2 | 3)[];
  hedgeAdjustmentTypes: readonly ScenarioHedgeAdjustmentType[];
};

export function getScenarioId(input: GetScenarioIdInput): ScenarioId | undefined {
  return scenarioDescriptors.find((descriptor) => {
    return (
      descriptor.strategyType === input.strategyType &&
      descriptor.lineMode === input.lineMode &&
      descriptor.mode === input.mode &&
      descriptor.promoAction === input.promoAction &&
      descriptor.dutchingOptionsCount === input.dutchingOptionsCount &&
      descriptor.hedgeAdjustmentType === input.hedgeAdjustmentType
    );
  })?.id;
}

export function getCompatibleScenarios(
  input: ScenarioAvailabilityInput = {},
): readonly ScenarioDescriptor[] {
  return scenarioDescriptors.filter((descriptor) => {
    return (
      (input.operation !== 'create' || descriptor.hedgeAdjustmentType === undefined) &&
      matchesDefinedValue(descriptor.strategyType, input.strategyType) &&
      matchesDefinedValue(descriptor.lineMode, input.lineMode) &&
      matchesDefinedValue(descriptor.mode, input.mode) &&
      matchesDefinedValue(descriptor.promoAction, input.promoAction) &&
      matchesDefinedValue(descriptor.dutchingOptionsCount, input.dutchingOptionsCount) &&
      matchesDefinedValue(descriptor.hedgeAdjustmentType, input.hedgeAdjustmentType)
    );
  });
}

export function getAvailableScenarioOptions(
  input: ScenarioAvailabilityInput = {},
): ScenarioAvailability {
  const scenarios = getCompatibleScenarios(input);

  return {
    scenarios,
    strategyTypes: uniqueValues(scenarios.map((descriptor) => descriptor.strategyType)),
    lineModes: uniqueValues(scenarios.map((descriptor) => descriptor.lineMode)),
    modes: uniqueValues(scenarios.map((descriptor) => descriptor.mode)),
    promoActions: uniqueValues(scenarios.map((descriptor) => descriptor.promoAction)),
    dutchingOptionsCounts: uniqueValues(
      scenarios
        .map((descriptor) => descriptor.dutchingOptionsCount)
        .filter((count): count is 2 | 3 => count !== undefined),
    ),
    hedgeAdjustmentTypes: uniqueValues(
      scenarios
        .map((descriptor) => descriptor.hedgeAdjustmentType)
        .filter(
          (hedgeAdjustmentType): hedgeAdjustmentType is ScenarioHedgeAdjustmentType =>
            hedgeAdjustmentType !== undefined,
        ),
    ),
  };
}

export function isScenarioSupported(input: ScenarioAvailabilityInput): boolean {
  return getCompatibleScenarios(input).length > 0;
}

export function getScenarioDescriptor(scenarioId: ScenarioId): ScenarioDescriptor {
  const descriptor = scenarioCatalog.get(scenarioId);

  if (!descriptor) {
    throw new Error(`Unknown scenarioId: ${scenarioId}`);
  }

  return descriptor;
}

export function validateLegShapeByScenario(
  scenarioId: ScenarioId,
  legs: ReadonlyArray<{ legRole?: ScenarioLegRole | null }>,
): {
  valid: boolean;
  issues: string[];
  expectedLegRoles: readonly ScenarioLegRole[];
} {
  const descriptor = getScenarioDescriptor(scenarioId);
  const expectedLegRoles = descriptor.expectedLegRoles;
  const actualLegRoles = legs
    .map((leg) => leg.legRole ?? null)
    .filter((legRole): legRole is ScenarioLegRole => legRole !== null)
    .sort();
  const normalizedExpected = [...expectedLegRoles].sort();
  const issues: string[] = [];

  if (actualLegRoles.length !== normalizedExpected.length) {
    issues.push(
      `Expected ${normalizedExpected.length} legs (${normalizedExpected.join(', ')}), received ${actualLegRoles.length}.`,
    );
  }

  if (normalizedExpected.join('|') !== actualLegRoles.join('|')) {
    issues.push(
      `Expected leg roles ${normalizedExpected.join(', ')}, received ${actualLegRoles.join(', ') || 'none'}.`,
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    expectedLegRoles,
  };
}

function matchesDefinedValue<T>(value: T | undefined, expected: T | undefined): boolean {
  return expected === undefined || value === expected;
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
