import { Signal, CostSignalInput, MarketSignalInput } from './signal.types';
import { evaluateCostRules } from './signal.rules.cost';
import { evaluateMarketRules } from './signal.rules.market';

export const evaluateCostSignals = (input: CostSignalInput): Signal[] => {
    return evaluateCostRules(input);
};

export const evaluateMarketSignals = (input: MarketSignalInput): Signal[] => {
    return evaluateMarketRules(input);
};
