window.loadDashboard = function() {
    const main = document.getElementById("main-content");
    if (!main) return;

    // --- SAFETY LOCK ---
    if (typeof window.maxPagesByGrade === 'undefined') {
        console.warn("Dashboard: Config not ready, retrying...");
        setTimeout(window.loadDashboard, 100);
        return;
    }

    try {
        const masterData =
            (window.DataService && window.DataService.get()) ||
            { studyProgress: {} };

        const studyProgress = masterData.studyProgress || {};
        const subjects = ["Math", "Physics", "Chemistry", "Biology"];
        const grades = [9, 10, 11, 12];
        const config = window.maxPagesByGrade || {};

        let subjectHtml = "";

        subjects.forEach(subject => {

            let subjectTotalDone = 0;
            let subjectTotalMax = 0;

            grades.forEach(gradeKey => {

                const saved =
                    studyProgress[gradeKey.toString()] || {};

                const gradeConfig =
                    config[gradeKey] || {};

                const max = Number(gradeConfig?.[subject]) || 0;
                const done = Math.min(Number(saved?.[subject]) || 0, max);

                subjectTotalDone += done;
                subjectTotalMax += max;
            });

            const avg =
                subjectTotalMax > 0
                    ? Math.round((subjectTotalDone / subjectTotalMax) * 100)
                    : 0;

            subjectHtml += `
                <div class="dashboard-subject" style="margin-bottom: 25px; padding: 15px; background: #121821; border-radius: 10px; border: 1px solid #30363d;">
                    <h3 style="margin-top: 0; color: #00d4ff;">${subject}</h3>

                    <progress
                        max="${subjectTotalMax}"
                        value="${subjectTotalDone}"
                        style="width:100%; height:12px;">
                    </progress>

                    <p style="font-size: 14px; color: #8b949e; margin-top: 8px;">
                        <strong>${avg}%</strong> completion (
                        ${Number(subjectTotalDone || 0).toLocaleString()} /
                        ${Number(subjectTotalMax || 0).toLocaleString()} pages)
                    </p>
                </div>`;
        });

        main.innerHTML = `
            <h2 style="margin-bottom: 20px;">📊 Subject Mastery Dashboard</h2>
            <div class="dashboard-container">${subjectHtml}</div>`;

    } catch (err) {
        console.error("Dashboard Render Failed:", err);
        main.innerHTML = `<div style="padding:20px; color:red;">Error loading dashboard data.</div>`;
    }
};
