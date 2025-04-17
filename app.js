// Data Service
const DataService = {
    async loadCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('Failed to load CSV:', error);
            return null;
        }
    },

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim();
                return obj;
            }, {});
        });
    }
};

// Chart Manager
const ChartManager = {
    async initialize() {
        // Load all datasets
        const deliveryData = await this.loadAndParse('data/delivery_times.csv');
        const fuelData = await this.loadAndParse('data/fuel_usage.csv');
        const cargoData = await this.loadAndParse('data/cargo.csv');
        const routesData = await this.loadAndParse('data/routes.csv');
        const maintenanceData = await this.loadAndParse('data/maintenance.csv');

        // Create charts
        this.createDeliveryChart(deliveryData);
        this.createFuelChart(fuelData);
        this.createCargoChart(cargoData);
        this.createRouteChart(routesData);
        this.createMaintenanceChart(maintenanceData);
    },

    async loadAndParse(path) {
        const raw = await DataService.loadCSV(path);
        return DataService.parseCSV(raw);
    },

    createDeliveryChart(data) {
        const labels = [...new Set(data.map(d => d.date))].sort();
        const avgDuration = labels.map(date => {
            const daily = data.filter(d => d.date === date);
            return daily.reduce((sum, d) => sum + parseFloat(d.actual_duration_hrs), 0) / daily.length;
        });

        new Chart(document.getElementById('deliveryChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Duration (Hours)',
                    data: avgDuration,
                    borderColor: '#4e73df',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    createFuelChart(data) {
        const aircrafts = [...new Set(data.map(d => d.aircraft_id))];
        const efficiency = aircrafts.map(id => {
            const aircraft = data.find(d => d.aircraft_id === id);
            return (parseFloat(aircraft.fuel_liters) / (parseFloat(aircraft.distance_km) / 100)).toFixed(2);
        });

        new Chart(document.getElementById('fuelChart'), {
            type: 'bar',
            data: {
                labels: aircrafts,
                datasets: [{
                    label: 'Fuel per 100km (Liters)',
                    data: efficiency,
                    backgroundColor: '#1cc88a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    createCargoChart(data) {
        const types = data.reduce((acc, cargo) => {
            acc[cargo.cargo_type] = (acc[cargo.cargo_type] || 0) + parseFloat(cargo.weight_kg);
            return acc;
        }, {});

        new Chart(document.getElementById('cargoChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(types),
                datasets: [{
                    data: Object.values(types),
                    backgroundColor: ['#36b9cc', '#1cc88a', '#f6c23e', '#e74a3b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    createRouteChart(data) {
        new Chart(document.getElementById('routeChart'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Route Efficiency',
                    data: data.map(d => ({
                        x: parseFloat(d.optimal_time_hrs),
                        y: parseFloat(d.actual_time_hrs)
                    })),
                    backgroundColor: '#f6c23e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Optimal Time (Hours)' } },
                    y: { title: { display: true, text: 'Actual Time (Hours)' } }
                }
            }
        });
    },

    createMaintenanceChart(data) {
        const scores = data.reduce((acc, check) => {
            acc[check.check_type] = acc[check.check_type] || [];
            acc[check.check_type].push(parseFloat(check.score));
            return acc;
        }, {});

        new Chart(document.getElementById('maintenanceChart'), {
            type: 'radar',
            data: {
                labels: Object.keys(scores),
                datasets: [{
                    label: 'Average Scores',
                    data: Object.values(scores).map(s => s.reduce((a,b) => a + b, 0) / s.length),
                    backgroundColor: 'rgba(231, 76, 60, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: { min: 0, max: 100 }
                }
            }
        });
    }
};

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => ChartManager.initialize());