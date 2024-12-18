export const getVegetables = async () => {
    const response = await fetch(`http://localhost:8088/vegetables`);
    const vegetables = await response.json();
    return vegetables;
};

