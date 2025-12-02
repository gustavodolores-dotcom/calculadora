import React, { useState } from 'react';
import './Calculator.css';

function Calculator() {
  const [userName, setUserName] = useState('');
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [dbStatus, setDbStatus] = useState('');
  const [dbLog, setDbLog] = useState([]);

  const appendNumber = (number) => {
    const newExpression = expression + number;
    setExpression(newExpression);
    setDisplay(newExpression);
  };

  const appendOperator = (operator) => {
    if (expression === '') return;
    if (isOperator(expression.charAt(expression.length - 1))) {
      setExpression(expression.slice(0, -1) + operator);
      setDisplay(expression.slice(0, -1) + operator);
    } else {
      const newExpression = expression + operator;
      setExpression(newExpression);
      setDisplay(newExpression);
    }
  };

  const isOperator = (char) => {
    return ['+', '-', '*', '/', '%'].includes(char);
  };

  const clearDisplay = () => {
    setExpression('');
    setDisplay('0');
  };

  const deleteLast = () => {
    const newExpression = expression.slice(0, -1);
    setExpression(newExpression);
    setDisplay(newExpression || '0');
  };

  const calculate = () => {
    if (expression === '') return;

    try {
      let calculation = expression.replace(/%/g, '/100*');

      if (isOperator(calculation.charAt(calculation.length - 1))) {
        calculation = calculation.slice(0, -1);
      }

      // eslint-disable-next-line no-eval
      let result = eval(calculation);
      result = Math.round(result * 100000000) / 100000000;

      setExpression(result.toString());
      setDisplay(result.toString());
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const testDatabaseConnection = async () => {
    const logs = [];
    try {
      logs.push('🔄 Probando conexión con la base de datos...');
      setDbLog([...logs]);
      setDbStatus('testing');

      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logs.push(`📡 Respuesta del servidor: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logs.push(`✅ Conexión exitosa: ${JSON.stringify(data)}`);
      setDbStatus('connected');
      setDbLog([...logs]);
    } catch (error) {
      logs.push(`❌ Error de conexión: ${error.message}`);
      setDbStatus('failed');
      setDbLog([...logs]);
      console.error('Error:', error);
    }
  };

  return (
    <div className="calculator">
      <div className="user-info">
        <input 
          type="text" 
          placeholder="Ingresa tu nombre" 
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="name-input"
        />
        {userName && <p className="greeting">¡Hola, {userName}!</p>}
        <button className="btn-db-test" onClick={testDatabaseConnection}>
          🔌 Probar DB
        </button>
        {dbStatus && (
          <div className={`db-status ${dbStatus}`}>
            {dbStatus === 'testing' && '⏳ Probando...'}
            {dbStatus === 'connected' && '✅ Conectado'}
            {dbStatus === 'failed' && '❌ Error'}
          </div>
        )}
        {dbLog.length > 0 && (
          <div className="db-log">
            {dbLog.map((log, index) => (
              <p key={index} className="log-entry">{log}</p>
            ))}
          </div>
        )}
      </div>
      <div className="display">
        <input type="text" value={display} readOnly />
      </div>
      <div className="buttons">
        <button className="btn btn-clear" onClick={clearDisplay}>
          C
        </button>
        <button className="btn btn-operator" onClick={() => appendOperator('/')}>
          /
        </button>
        <button className="btn btn-operator" onClick={() => appendOperator('*')}>
          *
        </button>
        <button className="btn btn-delete" onClick={deleteLast}>
          ←
        </button>

        <button className="btn" onClick={() => appendNumber('7')}>
          7
        </button>
        <button className="btn" onClick={() => appendNumber('8')}>
          8
        </button>
        <button className="btn" onClick={() => appendNumber('9')}>
          9
        </button>
        <button className="btn btn-operator" onClick={() => appendOperator('-')}>
          -
        </button>

        <button className="btn" onClick={() => appendNumber('4')}>
          4
        </button>
        <button className="btn" onClick={() => appendNumber('5')}>
          5
        </button>
        <button className="btn" onClick={() => appendNumber('6')}>
          6
        </button>
        <button className="btn btn-operator" onClick={() => appendOperator('+')}>
          +
        </button>

        <button className="btn" onClick={() => appendNumber('1')}>
          1
        </button>
        <button className="btn" onClick={() => appendNumber('2')}>
          2
        </button>
        <button className="btn" onClick={() => appendNumber('3')}>
          3
        </button>
        <button className="btn btn-operator" onClick={() => appendOperator('%')}>
          %
        </button>

        <button className="btn" onClick={() => appendNumber('0')}>
          0
        </button>
        <button className="btn" onClick={() => appendNumber('.')}>
          .
        </button>
        <button className="btn btn-equals" onClick={calculate}>
          =
        </button>
      </div>
    </div>
  );
}

export default Calculator;
