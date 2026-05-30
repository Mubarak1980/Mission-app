window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Calculations
    const masterData = window.DataService.get();
    const cycleGoalPages = 4638;
    const cycleGoalDays = 90;
    const yearlyGoalPages = 18552; // 4,638 * 4 cycles
    const yearlyGoalDays = 360;

    let totalCompletedPages = 0;
    if (masterData.studyProgress) {
        Object.values(masterData.studyProgress).forEach(gradeData => {
            Object.values(gradeData).forEach(pages => totalCompletedPages += Number(pages) || 0);
        });
    }

    const startDate = new Date(masterData.startDate || new Date());
    const daysPassed = Math.min(Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)), yearlyGoalDays);
    
    const pagePercent = Math.min(Math.round((totalCompletedPages / yearlyGoalPages) * 100), 100);
    const timePercent = Math.min(Math.round((daysPassed / yearlyGoalDays) * 100), 100);
    
    // Dynamic Target from Smart Engine
    const dynamicTarget = window.SmartEngine.calculateDynamicTarget();

    // 2. Data Matrix
    const planData = [
        { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9 },
        { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12 },
        { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13 },
        { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14 }
    ];

    let rowsHtml = planData.map(row => `
        <tr>
            <td style="font-weight: 700; color: #00d4ff;">${row.grade}</td>
            <td>${row.total.toLocaleString()}</td>
            <td>${row.days}</td>
            <td>${row.math}</td><td>${row.phys}</td><td>${row.chem}</td><td>${row.bio}</td>
            <td style="color: #00d4ff;">${dynamicTarget}</td>
        </tr>
    `).join("");

    // 3. Render: Full Information Set
    container.innerHTML = `
        <h2>📅 Adaptive Daily Distribution (Cycle ${masterData.cycleNumber || 1}/4)</h2>
        <div style="overflow-x: auto; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: center; color: white;">
                <thead><tr style="border-bottom: 1px solid #30363d;"><th>Grade</th><th>Pages</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Target</th></tr></thead>
                <tbody>${rowsHtml}<tr style="border-top: 2px solid #30363d; font-weight: bold;"><td>Total</td><td>4,638</td><td>90</td><td>—</td><td>—</td><td>—</td><td>—</td><td>≈${dynamicTarget}/d</td></tr></tbody>
            </table>
        </div>

        <div style="background: #121821; padding: 15px; border-radius: 10px; border-left: 4px solid #00d4ff;">
            <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
            <p style="margin: 5px 0;">Current Objective: <strong>${cycleGoalPages} pages</strong> per 90-day cycle.</p>
            <p style="margin: 5px 0;">Daily Performance Goal: <strong>${dynamicTarget} pages/day</strong> (Adjusted).</p>
            <p style="margin: 5px 0;">Rotation Status: <strong>Cycle ${masterData.cycleNumber || 1} of 4</strong> active.</p>
            
            <div style="margin-top: 15px;">
                <p style="margin: 5px 0;">Yearly Mastery: <strong>${pagePercent}%</strong> of annual goal reached.</p>
                <progress value="${pagePercent}" max="100" style="width: 100%; height: 8px; margin-bottom: 10px;"></progress>
                
                <p style="margin: 5px 0;">Workload Balance: <strong>${window.SmartEngine.getWorkloadStatus(pagePercent, timePercent)}</strong></p>
            </div>
        </div>
    `;
};
        
