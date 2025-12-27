import { Signal, CostSignalInput, MarketSignalInput } from './signal.types';
import { evaluateCostRules } from './signal.rules.cost';
import { evaluateMarketRules } from './signal.rules.market';
import { evaluateStockRules } from './signal.rules.stock';

export const evaluateCostSignals = (input: CostSignalInput): Signal[] => {
    return evaluateCostRules(input);
};

export const evaluateMarketSignals = (input: MarketSignalInput): Signal[] => {
    return evaluateMarketRules(input);
};

export const evaluateStockSignals = (input: any): Signal[] => {
    return evaluateStockRules(input);
};
