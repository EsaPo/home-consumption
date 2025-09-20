// heat.js
const express = require('express');
const router = express.Router();
const db = require('./dbconfig');

/*router.get('/', (req, res) => {
    db.all('SELECT * FROM vesi', [], (err, rows) => {
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
        FROM vesi_with_consumption l
        LEFT JOIN kiinteisto k ON l.kiinteistotunnus = k.kiinteistotunnus
        ORDER BY lukemapva DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching vesi data:', err.message);
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
                vesilukema: (row.vesilukema).toFixed(4),
                //vesilukema: row.vesilukema,
                kulutus_vesi: (row.kulutus_vesi).toFixed(4) || 0,
                muuta: row.muuta
            }));

            res.json(transformedRows);
        }
    });
});

// Add heat data
router.post('/', (req, res) => {
    const { kiinteistotunnus, vuosi, kuukausi, lukemapva, vesilukema, muuta } = req.body;

    // Validate required fields based on NOT NULL constraints in database
    if (!kiinteistotunnus || !vuosi || !kuukausi || !lukemapva || vesilukema === undefined) {
        return res.status(400).json({ error: "Missing required fields: kiinteistotunnus, vuosi, kuukausi, lukemapva and vesilukema are required" });
    }

    const query = `
        INSERT INTO vesi (kiinteistotunnus, vuosi, kuukausi, lukemapva, vesilukema, muuta)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [kiinteistotunnus, vuosi, kuukausi, lukemapva, vesilukema, muuta], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        db.get("SELECT * FROM vesi WHERE id = ?", [this.lastID], (err, row) => {
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
    const { kiinteistotunnus, vuosi, kuukausi, lukemapva, vesilukema, muuta } = req.body;
    const sql = `
        UPDATE vesi
        SET kiinteistotunnus = ?, 
            vuosi = ?, 
            kuukausi = ?, 
            lukemapva = ?, 
            vesilukema = ?, 
            muuta = ?
        WHERE id = ?
    `;
    db.run(sql, [kiinteistotunnus, vuosi, kuukausi, lukemapva, vesilukema, muuta, id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to update water data' });
        }
        if (this.changes > 0) {
            db.get("SELECT * FROM vesi WHERE id = ?", [id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to retrieve updated water data' });
                }
                res.json({ message: 'Water updated successfully', heat: row });
            });
        } else {
            res.status(404).json({ error: 'Water data not found' });
        }
    });
});

// Delete heat data by ID
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM vesi WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete water data' });
        }
        if (this.changes > 0) {
            res.json({ message: 'Water data deleted successfully', id: id });
        } else {
            res.status(404).json({ error: 'Water data not found' });
        }
    });
});

module.exports = router;

