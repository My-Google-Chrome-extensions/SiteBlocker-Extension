// Remove duplicate items from an array and return a new array with unique elements
function uniqueArray(arr) {
    return Array.from(new Set(arr));
}

// Function to update blocked sites using Chrome storage and declarativeNetRequest API
function blockUpdate() {
    chrome.storage.local.get("data", async function (retrieved_data) {
        if (retrieved_data.hasOwnProperty("data") && retrieved_data.data) {
            const data = JSON.parse(retrieved_data.data);
            let dataB = [];
            if (Array.isArray(data) && data.length) {
                let i = 1;
                // Map each site to a formatted object and push to dataB array
                data.map(site => {
                    dataB.push({
                        "id": i,
                        "priority": 1,
                        "action": {
                            "type": "block"
                        },
                        "condition": {
                            "urlFilter": site,
                            "resourceTypes": [
                                "csp_report",
                                "font",
                                "image",
                                "main_frame",
                                "media",
                                "object",
                                "other",
                                "ping",
                                "script",
                                "stylesheet",
                                "sub_frame",
                                "webbundle",
                                "websocket",
                                "webtransport",
                                "xmlhttprequest"
                            ]
                        }
                    });
                    i++;
                });
            }
            const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
            const oldRuleIds = oldRules.map(rule => rule.id);

            // Remove old rules and add new rules based on dataB array
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: oldRuleIds,
                addRules: dataB
            });
        }
    });
}

// Call the blockUpdate function to update blocked sites
blockUpdate();

// Load and display stored sites from Chrome storage
chrome.storage.local.get("data", function (retrieved_data) {
    if (retrieved_data.data) {
        const data = JSON.parse(retrieved_data.data);
        // Reverse data and create list items with delete buttons for each site
        data.reverse().map((item, index) => {
            const url = item;
            const li = document.createElement('li');
            li.innerHTML = `<span>${url}</span><button class="delete" data-site="${url}">✖</button>`;
            document.querySelector("ul").appendChild(li);

            if ((index + 1) === data.length) {
                // Add event listener to delete buttons
                document.querySelectorAll(".delete").forEach(itemD => {
                    itemD.addEventListener("click", (e) => {
                        const url = e.target.getAttribute("data-site");
                        const newSites = data.filter(item => item !== url);
                        // Update Chrome storage and reload the page after deletion
                        chrome.storage.local.set({
                            data: JSON.stringify(newSites.reverse())
                        }, () => {
                            document.querySelector(".new-site").style.display = "none";
                            location.reload();
                        });

                    });
                });
            }
        });
    }
});

// Open the "Add New Site" box
document.querySelector(".add-new-site").addEventListener("click", () => {
    document.querySelector(".new-site").style.display = "flex";
});

// Close the "Add New Site" box
document.querySelector("#close").addEventListener("click", () => {
    document.querySelector(".new-site").style.display = "none";
});

// Add a new site to the list
document.querySelector("#add").addEventListener("click", () => {
    let site = document.querySelector("#site").value;
    try {
        new URL(site)
    } catch (e) {
        return alert(e.message);
    }

    let url = new URL(site);

    if (`${url.hostname}${url.pathname}`.endsWith("/")) {
        url = `${url.hostname}${url.pathname}`.slice(0, -1);
    }

    site = url;
    chrome.storage.local.get("data", function (retrieved_data) {
        let urls = retrieved_data.data ? JSON.parse(retrieved_data.data) : [];

        urls.push(site);
        urls = uniqueArray(urls);

        // Update Chrome storage with the new site and reload the page
        chrome.storage.local.set({
            data: JSON.stringify(urls)
        }, () => {
            document.querySelector(".new-site").style.display = "none";
            location.reload();
        });
    });
});

// Init
chrome.storage.local.get("install", function (retrieved_data) {
    if (!retrieved_data.install) {
        document.querySelector(".loader").style.display = "block";
        fetch("https://raw.githubusercontent.com/My-Google-Chrome-extensions/SiteBlocker-Extension/main/rules.json")
            .then(response => response.json())
            .then(data => {
                chrome.storage.local.set({
                    install: "1"
                }, () => {
                    chrome.storage.local.get("data", function (retrieved_data) {
                        // Update Chrome storage with the new site and reload the page
                        chrome.storage.local.set({
                            data: JSON.stringify(data)
                        }, () => {
                            location.reload();
                        });
                    });
                });
                document.querySelector(".loader").style.display = "none";
            })
            .catch(error => {
                document.querySelector(".loader").style.display = "none";
                console.log(error);
            });
    }
});
