//#region Dom Elements 

// Cache DOM elements (Matching variable names with element IDs)

// Input elements
const commentId = document.querySelector("#id");
const firstName = document.querySelector("#firstName");
const lastName = document.querySelector("#lastName");
const email = document.querySelector("#email");
const tier = document.querySelector("#tier");
const topicArea = document.querySelector("#topicArea");
const category = document.querySelector("#category");
const commentText = document.querySelector("#commentText");
const assignedTeamName = document.querySelector("#assignedTeamName");
const isSubstantive = document.querySelector("#isSubstantive");
const commentStatus = document.querySelector("#status");
const triageCategory = document.querySelector("#triageCategory");
const assignedTo = document.querySelector("#assignedTo");
const suggestedAction = document.querySelector("#suggestedAction");
const internalNotes = document.querySelector("#internalNotes");

// Buttons
const nextButton = document.querySelector("#nextButton");
const prevButton = document.querySelector("#prevButton");

//#endregion


//#region DB initialization 

let db;
const dbName = "CommentsDB";
const storeName = "CommentsStore";
const dbVersion = 1;

// Function to load the first record when the page loads
const loadFirstRecord = () => {
    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll(); // Get all records from the object store

    request.onsuccess = (event) => {
        const records = event.target.result;
        (records && records.length > 0) ? updateUI(records[0]) : console.log(`No records found in the database.`);
    };

    request.onerror = event => console.error(`Error retrieving records from IndexedDB: ${event.target.error}`);
}


// Open IndexedDB and Create Object Store if Not Exists
const openDatabase = () => {

    // Open or create IndexedDB
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
        db = event.target.result;

        // Get version
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || db.version;

        if (oldVersion === 0) {
            console.log(`Database is being created for the first time.`);
        } else {
            console.log(`Database is being upgraded from version ${oldVersion} to ${newVersion}.`);
        }

        // Create the object store if not exists
        if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
            // Define schema
            objectStore.createIndex("id", "id", { unique: true });
            objectStore.createIndex("firstName", "firstName", { unique: false });
            objectStore.createIndex("lastName", "lastName", { unique: false });
            objectStore.createIndex("email", "email", { unique: false });
            objectStore.createIndex("tier", "tier", { unique: false });
            objectStore.createIndex("topicArea", "topicArea", { unique: false });
            objectStore.createIndex("category", "category", { unique: false });
            objectStore.createIndex("commentText", "commentText", { unique: false });
            objectStore.createIndex("assignedTeamName", "assignedTeamName", { unique: false });
            objectStore.createIndex("isSubstantive", "isSubstantive", { unique: false });
            objectStore.createIndex("status", "status", { unique: false });
            objectStore.createIndex("triageCategory", "triageCategory", { unique: false });
            objectStore.createIndex("assignedTo", "assignedTo", { unique: false });
            objectStore.createIndex("suggestedAction", "suggestedAction", { unique: false });
            objectStore.createIndex("internalNotes", "internalNotes", { unique: false });
            // Log output
            console.log(`Object store named ${storeName} has been successfully created.`);
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log(`Database "${dbName}" opened successfully.`);
        // Call the function to check and load records
        loadFirstRecord();
    };

    request.onerror = (event) => {
        console.error(`Database error: ${event.target.error?.message}`);
    };

}

openDatabase();

//#endregion


//#region CSV Upload Handlers 

const uploadCSV = () => {
    const fileInput = document.querySelector("#csvFileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV file first.");
        return;
    }

    if (file.type !== "text/csv") {
        alert("Only CSV files are allowed.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        const records = parseCSV(csvData);

        records.length > 0 ? saveToIndexedDB(records) : alert(`No valid data found in the CSV file.`);
    };

    reader.readAsText(file);
};

const parseCSV = (csvText) => {
    const lines = csvText.split("\n").map(line => line.trim()).filter(line => line);
    const headers = lines[0].split(",").map(header => header.trim());
    const records = [];

    lines.slice(1).forEach(line => {
        const values = line.split(",").map(value => value.trim());
        if (values.length === headers.length) {
            let record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            records.push(record);
        }
    });

    console.log(`Parsed ${records.length} records from CSV.`);
    return records;
};

const saveToIndexedDB = (records) => {
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    records.forEach(record => {
        const request = objectStore.get(record.id);
        request.onsuccess = () => {
            if (request.result) {
                console.warn(`Record with id ${record.id} already exists. Skipping...`);
            } else {
                objectStore.add(record);
            }
        };
    });

    transaction.oncomplete = () => {
        const statusDiv = document.querySelector("#uploadStatus");
        statusDiv.style.display = "block";
        statusDiv.innerText = "✅ CSV records uploaded to DB!";
        document.querySelector("#csvFileInput").value = "";
        console.log(`Records processed for ${storeName}.`);

        // Load first record if no data is currently loaded
        loadDataAndDisplayFirstRecord();
    };

    transaction.onerror = (event) => {
        const statusDiv = document.querySelector("#uploadStatus");
        statusDiv.style.display = "block";
        statusDiv.innerText = "❌ Failed to upload records.";
        console.error(`Transaction failed: ${event.target.error}`);
    };
};

// Function to check if data is available in IndexedDB and load first record
const loadDataAndDisplayFirstRecord = () => {
    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();

    request.onsuccess = () => {
        const records = request.result;
        if (records.length > 0) {
            // Trigger display of the first record
            displayRecord(records[0]);
        } else {
            console.log("No records found in the store.");
        }
    };

    request.onerror = (event) => {
        console.error(`Failed to load data: ${event.target.error}`);
    };
};

//#endregion


//#region Helper Functions 

// Function to display a specific record
const displayRecord = (record) => {
    firstName.textContent = record.firstName;
    lastName.textContent = record.lastName;
    email.textContent = record.email;
    tier.textContent = record.tier;
    topicArea.textContent = record.topicArea;
    category.textContent = record.category;
    commentText.textContent = record.commentText;

    // Show the display section if hidden
    document.querySelector("#displayFields").style.display = "block";
};

// Function to add sample data
const addSampleData = () => {
    const sampleComments = [
        {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            tier: "Gold",
            topicArea: "Technology",
            category: "Feedback",
            commentText: "Great product!",
            status: "Pending",
            triageCategory: "Low",
            assignedTo: "Team A",
            suggestedAction: "Review",
            isSubstantive: true,
            internalNotes: "Needs further review.",
        },
        {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            tier: "Silver",
            topicArea: "Support",
            category: "Issue",
            commentText: "Having trouble with the app.",
            status: "In Progress",
            triageCategory: "Medium",
            assignedTo: "Team B",
            suggestedAction: "Escalate",
            isSubstantive: false,
            internalNotes: "Needs investigation.",
        }
    ];

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    sampleComments.forEach((comment) => {
        const request = store.add(comment);
        request.onsuccess = () => console.log("Sample comment added:", comment);
        request.onerror = event => console.error("Error adding sample comment:", event.target.error);
    });
}

// Function to update the record count label
const updateRecordCount = (currentId) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
        const totalRecords = countRequest.result;
        document.getElementById("recordCount").textContent = `${currentId} of ${totalRecords}`;
    };
}

// Function to update the UI with comment data
const updateUI = (comment) => {
    console.log(`Comment record details\n: ${JSON.stringify(comment, null, 2)}`)
    commentId.textContent = comment.id;
    firstName.textContent = comment.firstName;
    lastName.textContent = comment.lastName;
    email.textContent = comment.email;
    tier.textContent = comment.tier;
    topicArea.textContent = comment.topicArea;
    category.textContent = comment.category;
    commentText.textContent = comment.commentText;

    commentStatus.value = comment.status;
    triageCategory.value = comment.triageCategory;
    assignedTo.value = comment.assignedTo;
    suggestedAction.value = comment.suggestedAction;
    isSubstantive.checked = comment.isSubstantive;
    internalNotes.value = comment.internalNotes;

    updateRecordCount(comment.id);
};

//#endregion


//#region CRUD Functions 

// Function to save a comment
const saveComment = (comment) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(comment);

    request.onsuccess = () => console.log(`Comment saved successfully`);
    request.onerror = (event) => console.error(`Error saving comment: ${event.target.error}`);

}

// Function to load a comment by ID
const loadComment = (id) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = (event) => {
        const comment = event.target.result;
        comment ? updateUI(comment) : console.log(`Comment not found`);
    };

    request.onerror = event => console.error(`Error loading comment: ${event.target.error}`);
}

//#endregion


//#region Event listeners for `Next` and `Previous` buttons

// Function to save the current comment
const saveCurrentComment = () => {
    const comment = {
        id: parseInt(commentId.value),
        status: commentStatus.value,
        triageCategory: triageCategory.value,
        assignedTo: assignedTo.value,
        suggestedAction: suggestedAction.value,
        isSubstantive: isSubstantive.checked,
        internalNotes: internalNotes.value,
    };
    saveComment(comment);
};

// Event listeners for `Next` button
nextButton.addEventListener("click", () => {
    const currentId = parseInt(commentId.value);
    saveCurrentComment();

    // Show spinner
    spinner.style.display = "block";
    spinner.style.position = "absolute";
    spinner.style.top = "50%";
    spinner.style.left = "50%";
    spinner.style.transform = "translate(-50%, -50%)";

    setTimeout(() => {
        loadComment(currentId + 1);
        // Hide spinner after loading
        spinner.style.display = "none";
    }, 1000);
});


// Event listeners for `Previous` button
prevButton.addEventListener("click", () => {
    const currentId = parseInt(commentId.value);
    saveCurrentComment();

    // Show spinner
    spinner.style.display = "block";
    spinner.style.position = "absolute";
    spinner.style.top = "50%";
    spinner.style.left = "50%";
    spinner.style.transform = "translate(-50%, -50%)";

    setTimeout(() => {
        loadComment(currentId - 1);
        // Hide spinner after loading
        spinner.style.display = "none";
    }, 1000);
});






//#endregion

