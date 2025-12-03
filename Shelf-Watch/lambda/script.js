
async function loadItems() {
    const container = document.getElementById("items-container");

    const res = await fetch("YOUR_API_URL/items");
    const items = await res.json();

    container.innerHTML = ""; // clear old content

    items.forEach(item => {
        const box = document.createElement("div");
        box.classList.add("item-card");

        // ---- Calculate Days Left ----
        const expiration = new Date(item.expirationDate);
        const today = new Date();
        const diffTime = expiration - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // ---- Choose color ----
        let color = "#5a5a5a"; // default gray

        if (!isNaN(daysLeft)) {
            if (daysLeft > 7) color = "#4CAF50";       // green
            else if (daysLeft >= 3) color = "#FFC107"; // yellow
            else if (daysLeft >= 0) color = "#F44336"; // red
            else color = "#616161";                    // dark gray (expired)
        }

        box.style.backgroundColor = color;

        // ---- Add item content ----
        box.innerHTML = `
            <div class="item-title">${item.name || "Unnamed Item"}</div>
            <div class="item-date"><strong>Expiration:</strong> ${item.expirationDate || "N/A"}</div>
            <div class="item-date"><strong>Days Left:</strong> ${isNaN(daysLeft) ? "Unknown" : daysLeft}</div>
        `;

        container.appendChild(box);
    });
}

// Auto-load when page opens
loadItems();