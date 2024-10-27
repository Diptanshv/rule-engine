export enum NodeType {
    OPERATOR = 'operator',
    COMPARISON = 'comparison'
}

export enum Operator {
    AND = 'AND',
    OR = 'OR'
}

export enum ComparisonOperator {
    GTE = '>=',
    LTE = '<=',
    NEQ = '!=',
    GT = '>',
    LT = '<',
    EQ = '=',
}

export interface Node {
    type: NodeType;
    left?: Node;
    right?: Node;
    value?: string | number;
    operator?: Operator | ComparisonOperator;
    isOptional?: boolean;
    attribute?: string;
}

// ruleEngine.ts
export class RuleEngine {
    private operatorPrecedence: Record<Operator, number> = {
        [Operator.AND]: 2,
        [Operator.OR]: 1
    };

    createRule(ruleString: string): Node {
        // Remove extra spaces and normalize the rule string
        const normalizedRule = this.normalizeRuleString(ruleString);
        console.log(normalizedRule);
        return this.parseExpression(normalizedRule);
    }

    private normalizeRuleString(ruleString: string): string {
        // Remove extra spaces and standardize the rule string
        return ruleString
            .replace(/\s+/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim();
    }

    private parseExpression(expression: string): Node {
        // Remove outer parentheses if they exist
        expression = expression.trim();
        if (expression.startsWith('(') && expression.endsWith(')')) {
            if (this.isMatchingParentheses(expression)) {
                expression = expression.slice(1, -1).trim();
            }
        }

        // Find the main operator (AND/OR) at the current level
        const operatorIndex = this.findMainOperator(expression);

        if (operatorIndex === -1) {
            // This must be a comparison
            return this.parseComparison(expression);
        }

        const operatorStr = expression.substr(operatorIndex,
            expression.substr(operatorIndex, 2) === 'OR' ? 2 : 3);
        const operator = operatorStr === 'OR' ? Operator.OR : Operator.AND;

        const leftExpr = expression.slice(0, operatorIndex).trim();
        const rightExpr = expression.slice(operatorIndex + operatorStr.length).trim();

        return {
            type: NodeType.OPERATOR,
            operator,
            left: this.parseExpression(leftExpr),
            right: this.parseExpression(rightExpr)
        };
    }

    private isMatchingParentheses(expression: string): boolean {
        let count = 0;
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') count++;
            else if (expression[i] === ')') count--;
            if (count === 0 && i < expression.length - 1) return false;
        }
        return count === 0;
    }

    private findMainOperator(expression: string): number {
        let parenCount = 0;
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') parenCount++;
            else if (expression[i] === ')') parenCount--;
            else if (parenCount === 0) {
                if (expression.substr(i, 3) === 'AND') return i;
                if (expression.substr(i, 2) === 'OR') return i;
            }
        }
        return -1;
    }


    combineRules(rules: string[]): Node {
        if (rules.length === 0) {
          throw new Error('No rules provided');
        }
    
        if (rules.length === 1) {
          return this.createRule(rules[0]);
        }
    
        // Convert all rules to ASTs
        const ruleNodes = rules.map(rule => this.createRule(rule));
    
        // Combine rules with OR operator as default
        // We can make this configurable if needed
        return ruleNodes.reduce((combined, current) => ({
          type: NodeType.OPERATOR,
          operator: Operator.OR,
          left: combined,
          right: current
        }));
    }

    private parseComparison(comparison: string): Node {
        // Find all possible operator positions
        const operatorPositions: { op: ComparisonOperator; index: number }[] = [];

        for (const op of Object.values(ComparisonOperator)) {
            let pos = -1;
            while ((pos = comparison.indexOf(op, pos + 1)) !== -1) {
                operatorPositions.push({ op: op as ComparisonOperator, index: pos });
            }
        }

        if (operatorPositions.length === 0) {
            throw new Error(`No valid operator found in comparison: ${comparison}`);
        }

        // Sort by position to find the main operator
        operatorPositions.sort((a, b) => a.index - b.index);

        // Use the first operator (leftmost) as the main operator
        const { op, index } = operatorPositions[0];

        const attribute = comparison.substring(0, index).trim();
        const valueStr = comparison.substring(index + op.length).trim();

        // Convert value to appropriate type and remove quotes if present
        let value: string | number = valueStr.replace(/['"]/g, '');
        if (!isNaN(Number(value))) {
            value = Number(value);
        }

        return {
            type: NodeType.COMPARISON,
            operator: op,
            attribute,
            value,
            isOptional: false 
        };
    }

    evaluateRule(rule: Node, data: Record<string, any>): boolean {
        if (rule.type === NodeType.OPERATOR) {
            const leftResult = this.evaluateRule(rule.left!, data);
            const rightResult = this.evaluateRule(rule.right!, data);

            return rule.operator === Operator.AND
                ? leftResult && rightResult
                : leftResult || rightResult;
        }

        if (rule.type === NodeType.COMPARISON) {
            // If attribute is not found and it's optional, return true
            if (!(rule.attribute! in data)) {
                return rule.isOptional || false;
            }

            const actualValue = data[rule.attribute!];

            // Handle null/undefined values
            if (actualValue == null) {
                return rule.isOptional || false;
            }

            switch (rule.operator) {
                case ComparisonOperator.GT:
                    return rule.value === undefined ?  false :  actualValue > rule.value;
                case ComparisonOperator.LT:
                    return rule.value === undefined ?  false :  actualValue < rule.value;
                case ComparisonOperator.EQ:
                    return actualValue === rule.value;
                case ComparisonOperator.GTE:
                    return rule.value === undefined ?  false :  actualValue >= rule.value;
                case ComparisonOperator.LTE:
                    return rule.value === undefined ?  false : actualValue <= rule.value;
                case ComparisonOperator.NEQ:
                    return actualValue !== rule.value;
                default:
                    throw new Error(`Unknown operator: ${rule.operator}`);
            }
        }

        throw new Error(`Invalid node type: ${rule.type}`);
    }
    markAttributeOptional(rule: Node, attribute: string): Node {
        if (rule.type === NodeType.COMPARISON && rule.attribute === attribute) {
          return { ...rule, isOptional: true };
        }
    
        if (rule.type === NodeType.OPERATOR) {
          return {
            ...rule,
            left: rule.left ? this.markAttributeOptional(rule.left, attribute) : undefined,
            right: rule.right ? this.markAttributeOptional(rule.right, attribute) : undefined
          };
        }
    
        return rule;
      }
    
}

