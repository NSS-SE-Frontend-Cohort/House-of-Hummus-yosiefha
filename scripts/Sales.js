
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
            alert("No items selected for purchase")
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

// Function to fetch all data
async function fetchData() {
    const [entrees, vegetables, sides] = await Promise.all([
        getEntrees(),
        getVegetables(),
        getSides()
    ]);

    if (!entrees || !vegetables || !sides) {
        throw new Error("Failed to fetch data from the API");
    }

    return { entrees, vegetables, sides };
}

// Function to generate HTML for a category
function generateCategoryHTML(title, items, itemKey, inputName, inputClass) {
    return `
        <div class="column">
            <h3>${title}</h3>
            ${items.map(item => `
                <label>
                    <input type="radio" name="${inputName}" class="${inputClass}" data-id="${item.id}">
                    ${item[itemKey]} - $${item.price.toFixed(2)}
                </label>
            `).join("")}
        </div>
    `;
}

// Function to attach event listeners for a category
function attachRadioEventListeners(className, items, category) {
    document.querySelectorAll(`.${className}`).forEach(radio => {
        radio.addEventListener("change", event => {
            const id = parseInt(event.target.dataset.id, 10);
            const item = items.find(item => parseInt(item.id) === id);
            toggleSelection(category, item);
        });
    });
}

// Function to handle the purchase button setup
function setupPurchaseButton() {
    const purchaseButton = document.getElementById("purchase");
    if (purchaseButton) {
        purchaseButton.addEventListener("click", async () => {
            await purchaseCombo();
        });
    }
}

// Main function to render the sales HTML and attach event listeners
export default async function Sales() {
    try {
        const { entrees, vegetables, sides } = await fetchData();

        // Generate the sales HTML
        const salesHTML = `
            ${generateCategoryHTML("Entrees", entrees, "name", "entree", "entree-radio")}
            ${generateCategoryHTML("Vegetables", vegetables, "type", "vegetable", "vegetable-radio")}
            ${generateCategoryHTML("Sides", sides, "title", "side", "side-radio")}
        `;

        // Attach event listeners
        setTimeout(() => {
            attachRadioEventListeners("entree-radio", entrees, "Entrees");
            attachRadioEventListeners("vegetable-radio", vegetables, "Vegetables");
            attachRadioEventListeners("side-radio", sides, "Sides");
            setupPurchaseButton();
        }, 0);

        return salesHTML;
    } catch (error) {
        console.error("Error fetching data:", error);
        return `<div class="error">Failed to load data. Please try again later.</div>`;
    }
}
