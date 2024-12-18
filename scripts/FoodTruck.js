import Sales from "./Sales.js";


export const FoodTruck = async () => {
    const salesHTML = await Sales();

    return `
        <header class="header">
            <img src="./images/hummus.png" class="logo" />
            <h1 class="title">Laura Kathryn's House of Hummus</h1>
        </header>

        <article>
            <button id="purchase">Purchase Combo</button>
            ${salesHTML}
        </article>

        <article class="customerOrders">
            <h2>Monthly Sales</h2>
            
        </article>
    `;
};

// Mount event listener to dynamically update purchases
document.addEventListener("DOMContentLoaded", async () => {
    const mainElement = document.querySelector("main");
    mainElement.innerHTML = await FoodTruck();
});