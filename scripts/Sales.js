
import { getEntrees } from "./Entrees.js";
import { getSides } from "./SideDishes.js";
import { getVegetables } from "./Vegetables.js";
import { transientState } from "./TransientState.js";


// Helper function to toggle selections in transient state
export const toggleSelection = (category, item) => {
    // Use a Set to store selected IDs for efficiency
    const stateSet = transientState[`selected${category}Ids`] || new Set();
    const stateArray = transientState[`selected${category}`] || [];

    if (stateSet.has(item.id)) {
        // Remove item if it exists
        stateSet.delete(item.id);
        transientState[`selected${category}`] = stateArray.filter(selectedItem => selectedItem.id !== item.id);
    } else {
        // Add item if it doesn't exist
        stateSet.add(item.id);
        stateArray.push(item);
        transientState[`selected${category}`] = stateArray;
    }

    // Persist the updated Set in transientState
    transientState[`selected${category}Ids`] = stateSet;
};

// Function to handle purchase and save to local API
const purchaseCombo = async () => {
    try {
        // Check if transient state has data to submit
        if (
            transientState.selectedEntrees.length === 0 &&
            transientState.selectedVegetables.length === 0 &&
            transientState.selectedSides.length === 0
        ) {
            throw new Error("No items selected for purchase");
        }

        // Calculate total cost based on transient state
        const total = calculateTotal();

        const requestBody = {
            entrees: transientState.selectedEntrees.map(item => ({
                name: item.name,
                price: item.price
            })), 
            vegetables: transientState.selectedVegetables.map(item => ({
                type: item.type,
                price: item.price
            })), // Extract vegetable types and prices
            sides: transientState.selectedSides.map(item => ({
                title: item.title,
                price: item.price
            })), // Extract side titles and prices
            total: total
        };
        

        
        // POST request to save purchase
        const response = await fetch("http://localhost:8088/purchases", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const newSale = await response.json();
            displayPurchasedItem(newSale); // Display new sale on UI
            clearTransientState(); // Reset transient state after purchase
        } else {
            throw new Error("Failed to save the purchase");
        }
    } catch (error) {
        console.error("Error making purchase:", error);
    }
};

const calculateTotal = () => {
    const totalEntrees = transientState.selectedEntrees.reduce((acc, item) => acc + (item.price || 0), 0);
    const totalVegetables = transientState.selectedVegetables.reduce((acc, item) => acc + (item.price || 0), 0);
    const totalSides = transientState.selectedSides.reduce((acc, item) => acc + (item.price || 0), 0);

    return totalEntrees + totalVegetables + totalSides;
};



export const displayPurchasedItem = (sale) => {
    const purchasedItems = `
        <div class="customerOrder">
            <p>Receipt #${sale.id} - $${sale.total.toFixed(2)}</p>
            <ul>
                <li><strong>Entrees:</strong> ${sale.entrees.map(entree => `${entree.name} ($${entree.price.toFixed(2)})`).join(", ")}</li>
                <li><strong>Vegetables:</strong> ${sale.vegetables.map(veg => `${veg.type} ($${veg.price.toFixed(2)})`).join(", ")}</li>
                <li><strong>Sides:</strong> ${sale.sides.map(side => `${side.title} ($${side.price.toFixed(2)})`).join(", ")}</li>
            </ul>
        </div>
    `;

    document.querySelector(".customerOrders").insertAdjacentHTML("beforeend", purchasedItems);
};





const clearTransientState = () => {
    transientState.selectedEntrees = [];
    transientState.selectedVegetables = [];
    transientState.selectedSides = [];
};

export default async function Sales() {
    try {
        const [entrees, vegetables, sides] = await Promise.all([
            getEntrees(),
            getVegetables(),
            getSides()
        ]);

        if (!entrees || !vegetables || !sides) {
            throw new Error("Failed to fetch data from the API");
        }

        // Generate the HTML for the food options
        const salesHTML = `
            <div class="column">
                <h3>Entrees</h3>
                ${entrees.map((entree, index) => `
                    <label>
                        <input type="radio" name="entree" class="entree-radio" data-id="${entree.id}">
                        ${entree.name} - $${entree.price.toFixed(2)}
                    </label>

                `).join("")}
            </div>
            <div class="column">
                <h3>Vegetables</h3>
                ${vegetables.map((veg, index) => `
                    <label>
                        <input type="radio" name="vegetable" class="vegetable-radio" data-id="${veg.id}">
                        ${veg.type} - $${veg.price.toFixed(2)}
                    </label>
                `).join("")}
            </div>
            <div class="column">
                <h3>Sides</h3>
                ${sides.map((side, index) => `
                    <label>
                        <input type="radio" name="side" class="side-radio" data-id="${side.id}">
                        ${side.title} - $${side.price.toFixed(2)}
                    </label>
                `).join("")}
            </div>
        `;

        // Add event listeners after the HTML is inserted
        setTimeout(() => {
            // Attach listeners to entree radio buttons
            document.querySelectorAll(".entree-radio").forEach(radio => {
                radio.addEventListener("change", event => {
                    const id = parseInt(event.target.dataset.id, 10);
                    const item = entrees.find(entree => parseInt(entree.id) === id);
                    toggleSelection("Entrees", item);
                });
            });

            // Attach listeners to vegetable radio buttons
            document.querySelectorAll(".vegetable-radio").forEach(radio => {
                radio.addEventListener("change", event => {
                    const id = parseInt(event.target.dataset.id, 10);
                    const item = vegetables.find(veg => parseInt(veg.id) === id);
                    toggleSelection("Vegetables", item);
                });
            });

            // Attach listeners to side radio buttons
            document.querySelectorAll(".side-radio").forEach(radio => {
                radio.addEventListener("change", event => {
                    const id = parseInt(event.target.dataset.id, 10);
                    const item = sides.find(side => parseInt(side.id) === id);
                    toggleSelection("Sides", item);
                });
            });

            // Set up the purchase button
            const purchaseButton = document.getElementById("purchase");
            if (purchaseButton) {
                purchaseButton.addEventListener("click", async () => {
                    await purchaseCombo();
                });
            }
        }, 0);

        return salesHTML;
    } catch (error) {
        console.error("Error fetching data:", error);
        return `<div class="error">Failed to load data. Please try again later.</div>`;
    }
}

