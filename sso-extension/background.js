// BHSPL SSO Background Relay Service
// This script runs in the background and can fetch data from localhost:8000 even if the front page is HTTPS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FETCH_CREDS") {
        console.log("SSO Background: Fetching credentials for token:", request.token);
        
        fetch(`http://localhost:8000/sso-system/get-creds/?token=${request.token}`)
            .then(res => {
                if (!res.ok) throw new Error("Backend Error");
                return res.json();
            })
            .then(data => {
                console.log("SSO Background: Credentials received successfully.");
                sendResponse(data);
            })
            .catch(err => {
                console.error("SSO Background: Fetch failed:", err);
                sendResponse({ error: err.message });
            });
            
        return true; // Keeps the messaging channel open for the async fetch call
    }
});
