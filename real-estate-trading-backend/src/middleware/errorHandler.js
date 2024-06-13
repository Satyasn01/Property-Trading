// Handle 404 Not Found
app.use((req, res, next) => {
    res.status(404).send('Not Found');
});

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server Error');
});
