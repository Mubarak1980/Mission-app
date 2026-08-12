"use strict";

// ======================================================
// 1. DATA SERVICE (INDEXEDDB VERSION - IMPROVED ENGINE)
// ======================================================

window.DataService = {

    DB_NAME: "StudyTrackerDB",
    STORE_NAME: "mainData",
    KEY: "study_progress",

    _cachedData: null,
    _initPromise: null,
    _db: null,


    defaultData() {

        return {

            startDate:
                new Date()
                    .toISOString()
                    .split("T")[0],

            studyProgress: {},

            ui: {
                section: "study",
                grade: 9
            }

        };

    },


    async _openDB() {

        if (this._db) return this._db;

        return new Promise((resolve) => {

            try {

                const request = indexedDB.open(this.DB_NAME);


                request.addEventListener("upgradeneeded", (event) => {

                    const db = event.target.result;

                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }

                });


                request.addEventListener("success", () => {

                    this._db = request.result;
                    resolve(this._db);

                });


                request.addEventListener("error", () => {

                    console.warn("IndexedDB unavailable");
                    resolve(null);

                });


            } catch (err) {

                console.warn("Database open failed:", err);
                resolve(null);

            }

        });

    },


    async _init() {

        if (this._cachedData !== null) {
            return this._cachedData;
        }


        if (this._initPromise) {
            return this._initPromise;
        }


        this._initPromise = (async () => {

            const db = await this._openDB();


            if (!db) {

                this._cachedData = this.defaultData();
                return this._cachedData;

            }


            return new Promise((resolve) => {


                try {

                    const tx = db.transaction(
                        this.STORE_NAME,
                        "readonly"
                    );


                    const store = tx.objectStore(
                        this.STORE_NAME
                    );


                    const request = store.get(this.KEY);


                    request.addEventListener(
                        "success",
                        () => {

                            const result = request.result;

                            this._cachedData = {
                                ...this.defaultData(),
                                ...(result && typeof result === "object" ? result : {}),
                                studyProgress: {
                                    ...this.defaultData().studyProgress,
                                    ...((result && result.studyProgress) || {})
                                },
                                ui: {
                                    ...this.defaultData().ui,
                                    ...((result && result.ui) || {})
                                }
                            };

                            resolve(this._cachedData);

                        }
                    );


                    request.addEventListener(
                        "error",
                        () => {

                            this._cachedData =
                                this.defaultData();

                            resolve(this._cachedData);

                        }
                    );


                } catch (err) {

                    console.warn(
                        "Data load failed:",
                        err
                    );

                    this._cachedData =
                        this.defaultData();

                    resolve(this._cachedData);

                }


            });


        })();


        return this._initPromise;

    },


    get(fallback) {

        return (
            this._cachedData ||
            fallback ||
            this.defaultData()
        );

    },


    async set(data) {

        try {

            const previous =
                this._cachedData ||
                this.defaultData();

            const incoming =
                data &&
                typeof data === "object"
                    ? data
                    : {};

            const merged = {
                ...previous,
                ...incoming,
                studyProgress: {
                    ...(previous.studyProgress || {}),
                    ...(incoming.studyProgress || {})
                },
                ui: {
                    ...(previous.ui || this.defaultData().ui),
                    ...(incoming.ui || {})
                }
            };

            this._cachedData = merged;


            const db = await this._openDB();

            if (!db) return;


            const tx = db.transaction(
                this.STORE_NAME,
                "readwrite"
            );


            tx.objectStore(this.STORE_NAME)
                .put(merged, this.KEY);


        } catch (err) {

            console.warn(
                "Data save failed:",
                err
            );

        }

    },


    async forceSave() {

        try {

            if (!this._cachedData) {
                this._cachedData = this.defaultData();
            }

            await this.set(this._cachedData);

        } catch (err) {

            console.warn(
                "Force save failed:",
                err
            );

        }

    }

};



// ======================================================
// 2. UI CONTROLLER (INDEXEDDB VERSION - IMPROVED)
// ======================================================

window.UI = {

    DB_NAME:"UITrackerDB",
    STORE_NAME:"uiData",
    KEY:"mission_ui",

    _cachedUI:null,
    _initPromise:null,
    _db:null,


    async _openDB(){

        if(this._db) return this._db;


        return new Promise((resolve)=>{


            try{


                const request =
                    indexedDB.open(this.DB_NAME);


                request.addEventListener(
                    "upgradeneeded",
                    (event)=>{

                    const db =
                        event.target.result;


                    if(
                        !db.objectStoreNames
                        .contains(this.STORE_NAME)
                    ){

                        db.createObjectStore(
                            this.STORE_NAME
                        );

                    }

                });


                request.addEventListener(
                    "success",
                    ()=>{

                    this._db=request.result;
                    resolve(this._db);

                });


                request.addEventListener(
                    "error",
                    ()=>resolve(null)
                );


            }catch{

                resolve(null);

            }


        });

    },


    async _initUI(){

        if(this._cachedUI !== null)
            return this._cachedUI;


        if(this._initPromise)
            return this._initPromise;



        this._initPromise =
            (async()=>{


            const db =
                await this._openDB();



            if(!db){

                this._cachedUI =
                {
                    section:"study",
                    grade:9
                };

                return this._cachedUI;

            }



            return new Promise((resolve)=>{


                const tx =
                    db.transaction(
                        this.STORE_NAME,
                        "readonly"
                    );


                const request =
                    tx.objectStore(
                        this.STORE_NAME
                    )
                    .get(this.KEY);



                request.addEventListener(
                    "success",
                    ()=>{

                    this._cachedUI =
                        request.result ||
                        {
                            section:"study",
                            grade:9
                        };


                    resolve(this._cachedUI);

                });


                request.addEventListener(
                    "error",
                    ()=>{

                    this._cachedUI =
                    {
                        section:"study",
                        grade:9
                    };


                    resolve(this._cachedUI);

                });


            });


        })();


        return this._initPromise;

    },


    async save(section,grade){

        const uiData={
            section,
            grade
        };


        this._cachedUI=uiData;


        try{

            const db =
                await this._openDB();


            if(!db) return;


            const tx =
                db.transaction(
                    this.STORE_NAME,
                    "readwrite"
                );


            tx.objectStore(this.STORE_NAME)
            .put(uiData,this.KEY);


        }catch(err){

            console.warn(
                "UI save failed:",
                err
            );

        }

    },


    load(){

        return (
            this._cachedUI ||
            {
                section:"study",
                grade:9
            }
        );

    }

};

// ======================================================
// 3. MODULE REGISTRY (COMPATIBLE)
// ======================================================

window.SectionMap = {

    study: "loadStudySection",

    timetable: "loadWeeklyTimetable",

    dashboard: "loadDashboard",

    topstudent: "loadTopStudentMode",

    sunnah: "loadSunnahTracker"

};




// ======================================================
// 4. SAFE LOADER (IMPROVED)
// ======================================================

const MAX_RETRIES = 20;


window.loadSection = function(
    type,
    grade = 9,
    retry = 0
){

    const main =
        document.getElementById(
            "main-content"
        );


    if(!main) {

        console.warn(
            "Main content missing"
        );

        return;

    }



    if(retry > MAX_RETRIES){

        main.innerHTML = `

        <div style="
            padding:20px;
            color:#ff4757;
        ">

        Failed to load module:
        ${type}

        </div>

        `;

        return;

    }




    // Dashboard waits for curriculum data

    if(
        type === "dashboard" &&
        !window.maxPagesByGrade
    ){

        setTimeout(()=>{

            window.loadSection(
                type,
                grade,
                retry + 1
            );

        },150);


        return;

    }





    const fnName =
        window.SectionMap[type];



    if(
        !fnName ||
        typeof window[fnName] !== "function"
    ){

        setTimeout(()=>{

            window.loadSection(
                type,
                grade,
                retry + 1
            );

        },150);


        return;

    }




    try{


        window.UI.save(
            type,
            grade
        );



        requestAnimationFrame(()=>{


            if(type === "study"){

                window[fnName](grade);


            }else{


                window[fnName]();


            }


        });



    }
    catch(err){


        console.error(
            "Module error:",
            err
        );



        main.innerHTML = `

        <div style="
            padding:20px;
            color:#ff4757;
        ">

        ${err.message}

        </div>

        `;


    }


};




// ======================================================
// 5. SYSTEM BOOT (RACE CONDITION PROTECTED)
// ======================================================


function waitForSystemReady(callback){


    let attempts = 0;


    const check = ()=>{


        attempts++;


        const ready =

            window.DataService &&

            window.SectionMap &&

            typeof window.loadSection === "function";




        if(ready){

            callback();

            return;

        }




        if(attempts > 100){

            console.error(
                "System boot timeout"
            );

            return;

        }



        setTimeout(
            check,
            50
        );


    };


    check();


}




// ======================================================
// 6. PERSISTENT STORAGE REQUEST
// ======================================================


async function requestPersistentStorage(){


    try{


        if(
            navigator.storage &&
            navigator.storage.persist
        ){


            const result =
                await navigator.storage.persist();



            console.log(

                result ?

                "✅ PERSISTENT STORAGE GRANTED" :

                "⚠️ Persistent storage unavailable"

            );


        }



    }
    catch(err){


        console.warn(
            "Persistent storage error:",
            err
        );


    }


}





// ======================================================
// 7. START APP (IMPROVED STARTUP)
// ======================================================


document.addEventListener(
"DOMContentLoaded",
async()=>{


    try{


        await window.DataService._init();


        await window.UI._initUI();




        waitForSystemReady(()=>{


            const lastUI =
                window.UI.load();



            window.loadSection(

                lastUI.section || "study",

                lastUI.grade || 9

            );



            requestPersistentStorage();



        });



    }
    catch(err){


        console.error(
            "Application startup failed:",
            err
        );


        const main =
            document.getElementById(
                "main-content"
            );


        if(main){

            main.innerHTML = `

            <div style="
                padding:20px;
                color:#ff4757;
            ">

            Application failed to start.

            </div>

            `;

        }


    }


});


// ======================================================
// 🛡️ RELIABILITY SYSTEM (IMPROVED SNAPSHOT ENGINE)
// ======================================================

(function(){


    const SNAPSHOT_PREFIX =
        "study_snapshot_";


    const MAX_SNAPSHOTS = 5;


    const SNAPSHOT_DB_NAME =
        "SnapshotTrackerDB";


    const SNAPSHOT_STORE_NAME =
        "snapshots";




    async function _openSnapshotDB(){


        return new Promise((resolve)=>{


            try{


                const request =
                    indexedDB.open(
                        SNAPSHOT_DB_NAME
                    );



                request.addEventListener(
                    "upgradeneeded",
                    (event)=>{


                    const db =
                        event.target.result;



                    if(
                        !db.objectStoreNames
                        .contains(
                            SNAPSHOT_STORE_NAME
                        )
                    ){


                        db.createObjectStore(
                            SNAPSHOT_STORE_NAME
                        );


                    }


                });



                request.addEventListener(
                    "success",
                    ()=>{

                    resolve(
                        request.result
                    );

                });



                request.addEventListener(
                    "error",
                    ()=>resolve(null)
                );



            }
            catch(err){

                console.warn(
                    "Snapshot DB error:",
                    err
                );

                resolve(null);

            }


        });


    }






    async function createSnapshot(){


        try{


            const raw =
                window.DataService
                ._cachedData;



            if(!raw)
                return;




            const db =
                await _openSnapshotDB();



            if(!db)
                return;




            const snapshot =
                typeof structuredClone === "function" ?

                structuredClone(raw) :

                JSON.parse(
                    JSON.stringify(raw)
                );




            const key =
                SNAPSHOT_PREFIX +
                Date.now();




            const tx =
                db.transaction(
                    SNAPSHOT_STORE_NAME,
                    "readwrite"
                );



            tx.objectStore(
                SNAPSHOT_STORE_NAME
            )
            .put(
                snapshot,
                key
            );



            cleanupSnapshots(db);



        }
        catch(err){


            console.warn(
                "Snapshot creation failed:",
                err
            );


        }


    }






    function cleanupSnapshots(db){


        try{


            const tx =
                db.transaction(
                    SNAPSHOT_STORE_NAME,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    SNAPSHOT_STORE_NAME
                );



            const request =
                store.getAllKeys();




            request.addEventListener(
                "success",
                ()=>{


                const keys =
                    request.result
                    .sort();



                while(
                    keys.length >
                    MAX_SNAPSHOTS
                ){


                    const old =
                        keys.shift();



                    const deleteTx =
                        db.transaction(
                            SNAPSHOT_STORE_NAME,
                            "readwrite"
                        );



                    deleteTx.objectStore(
                        SNAPSHOT_STORE_NAME
                    )
                    .delete(old);


                }



            });


        }
        catch(err){

            console.warn(
                "Snapshot cleanup failed:",
                err
            );

        }


    }






    async function recover(){


        try{


            const data =
                window.DataService
                ._cachedData;



            if(
                data &&
                typeof data === "object" &&
                data.studyProgress
            ){

                return;

            }




            const db =
                await _openSnapshotDB();



            if(!db)
                return;




            const tx =
                db.transaction(
                    SNAPSHOT_STORE_NAME,
                    "readonly"
                );



            const store =
                tx.objectStore(
                    SNAPSHOT_STORE_NAME
                );



            const request =
                store.openCursor(
                    null,
                    "prev"
                );




            request.addEventListener(
                "success",
                (event)=>{


                const cursor =
                    event.target.result;



                if(cursor){


                    window.DataService
                    ._cachedData =
                        cursor.value;



                    window.DataService
                    .set(
                        cursor.value
                    );



                    console.log(
                        "Recovered latest snapshot"
                    );


                }



            });



        }
        catch(err){


            console.warn(
                "Recovery failed:",
                err
            );


        }


    }






    function updateConnectionStatus(){


        document.body.dataset.online =
            navigator.onLine
            ? "true"
            : "false";


    }






    window.addEventListener(
        "online",
        updateConnectionStatus
    );


    window.addEventListener(
        "offline",
        updateConnectionStatus
    );






    document.addEventListener(
        "DOMContentLoaded",
        ()=>{


        recover();


        updateConnectionStatus();


        setTimeout(
            createSnapshot,
            3000
        );



        setInterval(
            createSnapshot,
            1000 * 60 * 60
        );



    });



})();
