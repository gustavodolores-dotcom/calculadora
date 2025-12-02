let display = document.getElementById('display');
let expression = '';

function appendNumber(number) {
    expression += number;
    updateDisplay();
}

function appendOperator(operator) {
    if (expression === '') return;
    if (isOperator(expression.charAt(expression.length - 1))) {
        expression = expression.slice(0, -1);
    }
    expression += operator;
    updateDisplay();
}

function isOperator(char) {
    return ['+', '-', '*', '/', '%'].includes(char);
}

function clearDisplay() {
    expression = '';
    updateDisplay();
}

function deleteLast() {
    expression = expression.slice(0, -1);
    updateDisplay();
}

function updateDisplay() {
    display.value = expression;
}

function calculate() {
    if (expression === '') return;
    
    try {
        // Replace % with /100* for percentage calculation
        let calculation = expression.replace(/%/g, '/100*');
        
        // Remove trailing operator if exists
        if (isOperator(calculation.charAt(calculation.length - 1))) {
            calculation = calculation.slice(0, -1);
        }
        
        // Evaluate the expression
        let result = eval(calculation);
        
        // Handle floating point precision
        result = Math.round(result * 100000000) / 100000000;
        
        expression = result.toString();
        updateDisplay();
    } catch (error) {
        display.value = 'Error';
        expression = '';
    }
}

// Allow keyboard input
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    }
});
