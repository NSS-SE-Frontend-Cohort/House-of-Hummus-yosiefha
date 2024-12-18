export const getSides = async () => {
    const response = await fetch(`http://localhost:8088/sides`);
    const sides = await response.json();
    return sides;
};

