function isHttpOrHttpsUrl(input) {
    const urlPattern = /^(http(s)?:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/\S*)?$/;
    return urlPattern.test(input);
}

function uniqueArray(arr) {
    return Array.from(new Set(arr));
}

function blockUpdate() {
    chrome.storage.local.get("data", async function (retrieved_data) {
        if (retrieved_data.hasOwnProperty("data") && retrieved_data.data) {
            const data = JSON.parse(retrieved_data.data);
            let dataB = [];
            if (Array.isArray(data) && data.length) {
                let i = 1;
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
                    })
                    i++;
                })
            }
            const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
            const oldRuleIds = oldRules.map(rule => rule.id);
            console.log(oldRules);
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: oldRuleIds,
                addRules: dataB
            });
        }
    });
}

blockUpdate();
// Load sites
chrome.storage.local.get("data", function (retrieved_data) {
    if (retrieved_data.data) {
        const data = JSON.parse(retrieved_data.data);
        data.reverse().map((item, index) => {
            const url = item;
            const li = document.createElement('li');
            li.innerHTML = `<span>${url}</span><button class="delete" data-site="${url}">✖</button>`;
            document.querySelector("ul").appendChild(li)

            if ((index + 1) === data.length) {
                document.querySelectorAll(".delete").forEach(itemD => {
                    itemD.addEventListener("click", (e) => {
                        const url = e.target.getAttribute("data-site");
                        const newSites = data.filter(item => item !== url);
                        chrome.storage.local.set({
                            data: JSON.stringify(newSites.reverse())
                        }, () => {
                            document.querySelector(".new-site").style.display = "none"
                            location.reload();
                        });

                    })
                });
            }
        })
    }
});

// Open box new site
document.querySelector(".add-new-site").addEventListener("click", () => {
    document.querySelector(".new-site").style.display = "flex"
})

// Close box new site
document.querySelector("#close").addEventListener("click", () => {
    document.querySelector(".new-site").style.display = "none"
})


// Add new site
document.querySelector("#add").addEventListener("click", () => {
    let site = document.querySelector("#site").value;
    if (!isHttpOrHttpsUrl(site))
        return alert("Site is invalid!")

    const url = new URL(site);

    site = `${url.hostname}${url.pathname}`;
    chrome.storage.local.get("data", function (retrieved_data) {
        let urls = retrieved_data.data ? JSON.parse(retrieved_data.data) : [];

        urls.push(site)
        urls = uniqueArray(urls);

        chrome.storage.local.set({
            data: JSON.stringify(urls)
        }, () => {
            document.querySelector(".new-site").style.display = "none"
            location.reload();
        });
    });

})

