export const getEntrees = async () => {
    const response = await fetch(`http://localhost:8088/entrees`);
    const entrees = await response.json();
    return entrees;
};
