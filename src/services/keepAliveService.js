const axios = require('axios');

/**
 * Periodically pings the live server to prevent Render's free tier from sleeping.
 * @param {string} productionUrl - The live URL assigned to you by Render.
 */
function keepZanjiEngineAlive(productionUrl) {
    if (process.env.NODE_ENV !== 'production') return;

    console.log("⏰ Keep-Alive worker initialized. Monitoring sleep threshold...");

    // Ping the server route precisely every 10 minutes (600,000 milliseconds)
    setInterval(async () => {
        try {
            const healthEndpoint = `${productionUrl}/health`;
            const response = await axios.get(healthEndpoint);
            console.log(`💚 Keep-Alive Ping Successful: Server reported status [${response.status}]`);
        } catch (error) {
            console.error("⚠️ Keep-Alive warning: Automated ping failed to reach cluster.", error.message);
        }
    }, 600000); 
}

module.exports = { keepZanjiEngineAlive };
