window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Calculations
    const masterData = window.DataService.get();
    const totalYearlyPages = 4638;
    const totalYearlyDays = 360;

    // Calculate total pages completed across all grades
    let totalCompletedPages = 0;
    if (masterData.studyProgress) {
        Object.values(masterData.studyProgress).forEach(gradeData => {
            Object.values(gradeData).forEach(pages => totalCompletedPages += Number(pages) || 0);
        });
    }

    // Calculate time progress
    const startDate = new Date(masterData.startDate || new Date());
    const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const timePercent = Math.min(Math.round((daysPassed / totalYearlyDays) * 100), 100);
    const pagePercent = Math.min(Math.round((totalCompletedPages / totalYearlyPages) * 100), 100);

    const smart = {
        cycleNumber: masterData.cycleNumber || 1,
        dailyTarget: Math.round(4638 / 90)
    };

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
            <td style="color: #00d4ff;">${smart.dailyTarget}</td>
        </tr>
    `).join("");

    // 3. Render
    container.innerHTML = `
        <h2>📅 Adaptive Daily Distribution (Cycle ${smart.cycleNumber}/4)</h2>
        <div style="overflow-x: auto; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: center; color: white;">
                <thead><tr style="border-bottom: 1px solid #30363d;"><th>Grade</th><th>Pages</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Target</th></tr></thead>
                <tbody>${rowsHtml}<tr style="border-top: 2px solid #30363d; font-weight: bold;"><td>Total</td><td>4,638</td><td>90</td><td>—</td><td>—</td><td>—</td><td>—</td><td>≈${smart.dailyTarget}/d</td></tr></tbody>
            </table>
        </div>

        <div style="background: #121821; padding: 15px; border-radius: 10px; border-left: 4px solid #00d4ff;">
            <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
            
            <p>Yearly Page Mastery: <strong>${pagePercent}%</strong> (${totalCompletedPages}/${totalYearlyPages})</p>
            <progress value="${pagePercent}" max="100" style="width: 100%; height: 10px; margin-bottom: 15px;"></progress>
            
            <p>Yearly Time Progress: <strong>${timePercent}%</strong> (${daysPassed}/${totalYearlyDays} days)</p>
            <progress value="${timePercent}" max="100" style="width: 100%; height: 10px;"></progress>
            
            <p style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">Rotation: Cycle ${smart.cycleNumber} of 4</p>
        </div>
    `;
};
              
