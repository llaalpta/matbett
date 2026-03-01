// import {
//   Bookmaker,
//   Options,
//   BetStatus,
//   HedgeType,
//   HedgeMode,
//   HedgeRole,
// } from "./betting";
// import {
//   QualifyConditionContext,
//   BasePromotionContext,
// } from "./rewardQualifyConditions";

// // Interfaz para agrupar datos del evento
// export interface BetEvent {
//   event: string;        // "Real Madrid v Barcelona"
//   market: string;       // "Ganador final", "Número de goles"
//   options: Options;     // 3, Multiple, 2
//   selection: string;    // "Real Madrid", "Más de 2", "Over"
// }

// // Forward declarations para evitar errores de orden
// export interface HedgeStrategyServerModel {
//   type: HedgeType;
//   mode: HedgeMode;
//   role: HedgeRole;
//   relatedBets: {
//     betId: string;
//     role: HedgeRole;
//   }[];
// }

// // Los contextos de qualify condition ahora se importan desde rewardQualifyConditions

// // Contexto para usar recompensas
// export interface RewardUseContext extends BasePromotionContext {
//   rewardId: string;
//   // Información específica de contribución (solo para rollover)
//   contribution?: {
//     stakeAmount: number;
//     rolloverContribution: number;
//     progressAfter: number;
//   };
// }

// // Contexto promocional unificado
// export type PromotionContext = QualifyConditionContext | RewardUseContext;

// // Contexto promocional con estrategia de hedge específica
// export interface PromotionContextWithHedge {
//   context: PromotionContext;
//   hedgeStrategy?: HedgeStrategyServerModel; // Estrategia completa para este contexto promocional
// }

// export interface BetRecord {
//   id: string;
//   createdAt: Date; // 
//   updatedAt: Date; //
//   bookmaker: Bookmaker;
//   bookmakerComission: number;
//   betEvent: BetEvent;   // Agrupamos event, market, options, selection
//   stake: number;
//   odds: number;
//   enhancedOdds?: EnhancedOddsServerModel;
//   risk: number;
//   profit: number;
//   status: BetStatus;
//   date: Date;
//   promotionContexts: PromotionContextWithHedge[]; // Array de contextos con estrategias específicas
// }

// export interface EnhancedOddsServerModel {
//   normalOdds: number;
//   enhancedOdds: number;
//   maxStake: number;
//   enhancedProfit: number;
//   profitDifference: number;
// }

// // Tipos para crear contextos (sin IDs que se generan después)
// type CreateQualifyConditionContext = Omit<QualifyConditionContext, "qualifyConditionId">;
// type CreateRewardUseContext = Omit<RewardUseContext, "rewardId">;

// export type CreatePromotionContext =
//   | CreateQualifyConditionContext
//   | CreateRewardUseContext;

// export type CreatePromotionContextWithHedge = {
//   context: CreatePromotionContext;
//   hedgeStrategy?: HedgeStrategyServerModel;
// };

// export type BetCreateParams = Omit<
//   BetRecord,
//   "id" | "createdAt" | "updatedAt" | "status" | "date"
// > & {
//   promotionContexts?: CreatePromotionContextWithHedge[];
// };

// export type BetUpdateParams = Partial<
//   Omit<BetRecord, "id" | "createdAt" | "updatedAt">
// > & {
//   id: string;
// };

// export interface BetListMetadata {
//   totalBets: number;
//   totalStake: number;
//   totalProfit: number;
//   profitByStatus: {
//     [key in BetStatus]: number;
//   };
// }

// export interface BetListResponse {
//   items: BetRecord[];
//   page: number;
//   pageSize: number;
//   total: number;
//   stats: BetListMetadata;
// }
