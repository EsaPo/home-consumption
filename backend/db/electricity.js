// heat.js
const express = require('express');
const router = express.Router();
const db = require('./dbconfig');

/*router.get('/', (req, res) => {
    db.all('SELECT * FROM sahko', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});*/

// Get all heating data with consumption calculations
router.get('/', (req, res) => {
    const query = `
        SELECT
            l.*,
            k.kiinteisto,
            k.osoite,
            k.omistajanimi
        FROM sahko_with_consumption l
        LEFT JOIN kiinteisto k ON l.kiinteistotunnus = k.kiinteistotunnus
        ORDER BY lukemapva DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching sahko data:', err.message);
            res.status(500).json({ error: 'Database error', details: err.message });
        } else {
            // Transform data to include consumption info
            const transformedRows = rows.map(row => ({
                id: row.id,
                kiinteistotunnus: row.kiinteistotunnus,
                kiinteisto: row.kiinteisto,
                osoite: row.osoite,
                omistajanimi: row.omistajanimi,
                vuosi: row.vuosi,
                kuukausi: row.kuukausi,
                kuukausi_num: row.kuukausi_num,
                lukemapva: row.lukemapva,
                sahkolukema: (row.sahkolukema).toFixed(0),
                //sahkolukema: row.sahkolukema,
                kulutus_sahko: (row.kulutus_sahko).toFixed(0) || 0,
                muuta: row.muuta
            }));

            res.json(transformedRows);
        }
    });
});

// Add heat data
router.post('/', (req, res) => {
    const { kiinteistotunnus, vuosi, kuukausi, lukemapva, sahkolukema, muuta } = req.body;

    // Validate required fields based on NOT NULL constraints in database
    if (!kiinteistotunnus || !vuosi || !kuukausi || !lukemapva || sahkolukema === undefined) {
        return res.status(400).json({ error: "Missing required fields: kiinteistotunnus, vuosi, kuukausi, lukemapva and sahkolukema are required" });
    }

    const query = `
        INSERT INTO sahko (kiinteistotunnus, vuosi, kuukausi, lukemapva, sahkolukema, muuta)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [kiinteistotunnus, vuosi, kuukausi, lukemapva, sahkolukema, muuta], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        db.get("SELECT * FROM sahko WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(row);
        });
    });
});


// Update heat data by ID
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { kiinteistotunnus, vuosi, kuukausi, lukemapva, sahkolukema, muuta } = req.body;
    const sql = `
        UPDATE sahko
        SET kiinteistotunnus = ?, 
            vuosi = ?, 
            kuukausi = ?, 
            lukemapva = ?, 
            sahkolukema = ?, 
            muuta = ?
        WHERE id = ?
    `;
    db.run(sql, [kiinteistotunnus, vuosi, kuukausi, lukemapva, sahkolukema, muuta, id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to update electricity data' });
        }
        if (this.changes > 0) {
            db.get("SELECT * FROM sahko WHERE id = ?", [id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to retrieve updated electricity data' });
                }
                res.json({ message: 'Electricity updated successfully', heat: row });
            });
        } else {
            res.status(404).json({ error: 'Electricity data not found' });
        }
    });
});

// Delete heat data by ID
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM sahko WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete electricity data' });
        }
        if (this.changes > 0) {
            res.json({ message: 'Electricity data deleted successfully', id: id });
        } else {
            res.status(404).json({ error: 'Electricity data not found' });
        }
    });
});

module.exports = router;

