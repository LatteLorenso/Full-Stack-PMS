const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Папка для отчетов
const reportDir = path.join(__dirname);
const rawResultsPath = path.join(reportDir, 'test-results.json');
const finalReportPath = path.join(reportDir, 'test-report.json');

if (!fs.existsSync(reportDir)){
    fs.mkdirSync(reportDir);
}

console.log('Запуск тестов...');

// Запуск Jest, сохранение данных от Jest в test-results.json
exec(`npx jest --detectOpenHandles --forceExit --json --outputFile="${rawResultsPath}"`, (error, stdout, stderr) => {
    
    try {
        // Результат от Jest
        const rawContent = fs.readFileSync(rawResultsPath, 'utf8');
        const results = JSON.parse(rawContent);

        // Отчет результатов тестов
        const report = {
            status: results.numFailedTests === 0 ? 'SUCCESS' : 'FAILED',
            exitCode: results.numFailedTests === 0 ? 0 : 1,
            timestamp: new Date().toLocaleString(),
            summary: {
                total: results.numTotalTests,
                passed: results.numPassedTests,
                failed: results.numFailedTests,
                execution: "Completed"
            },
            details: results.testResults.map(test => ({
                suiteName: test.name,
                status: test.status,
                assertions: test.assertionResults.map(a => ({
                    title: a.title,
                    status: a.status,
                    message: a.status === 'passed' ? 'OK' : a.failureMessages.join('\n')
                }))
            }))
        };

        fs.writeFileSync(finalReportPath, JSON.stringify(report, null, 2));

        console.log(results.numFailedTests === 0 ? 0 : 1);
        
        process.exit(results.numFailedTests === 0 ? 0 : 1);

    } catch (err) {
        console.error("Ошибка при обработке результатов:", err);
        console.log(1);
        process.exit(1);
    }
});