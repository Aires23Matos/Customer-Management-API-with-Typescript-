export const genUsername = (): string => {
    const usernamePrefix = 'user-';
    const randomCharts = Math.random().toString(36).slice(2);
    
    const username = usernamePrefix + randomCharts;

    return username;
}