const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const axios = require("axios");
const {executeQuery} = require("./utils");
app.use(express.urlencoded({ extended: true }));

const port = 3000;
const secret = "soal_tes_backend_adhivasindo";

function CekToken(req, res, next) {
    const token = req.headers["x-auth-token"];
    if (!token) {
        return res.status(401).send({
            "Pesan": "Token tidak ditemukan!"
        });
    }
    try {
        req.dataUser = jwt.verify(token, secret);
        next();
    }
    catch (err) {
        return res.status(400).send(err);
    }
}

function ValidasiParamNIM(req) {
    const schema =  Joi.object({
        "nim": Joi.string().required().messages({
            "any.required": "NIM harus disertakan!",
            "string.empty": "NIM wajib diisi!"
        })
    });
    const validationResult = schema.validate(req.params);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
}

function CekQueryNama(req, res, next) {
    const schema =  Joi.object({
        "nama": Joi.string().allow("").required().messages({
            "any.required": "Nama harus disertakan!"
        })
    });
    const validationResult = schema.validate(req.query);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    next();
}

function CekQueryNIM(req, res, next) {
    const schema =  Joi.object({
        "nim": Joi.string().allow("").required().messages({
            "any.required": "NIM harus disertakan!"
        })
    });
    const validationResult = schema.validate(req.query);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    next();
}

function CekQueryYMD(req, res, next) {
    const schema =  Joi.object({
        "ymd": Joi.string().allow("").required().messages({
            "any.required": "YMD harus disertakan!"
        })
    });
    const validationResult = schema.validate(req.query);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    next();
}

app.post("/api/login", async function (req, res) {
    const schema =  Joi.object({
        "nim": Joi.string().required().messages({
            "any.required": "NIM harus disertakan!",
            "string.empty": "NIM wajib diisi!"
        }),
        "nama": Joi.string().required().messages({
            "any.required": "Nama harus disertakan!",
            "string.empty": "Nama wajib diisi!"
        }),
        "ymd": Joi.string().required().messages({
            "any.required": "YMD harus disertakan!",
            "string.empty": "YMD wajib diisi!"
        })
    });
    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    try {
        const nim = req.body.nim;
        const nama = req.body.nama;
        const ymd = req.body.ymd;
        const hasil = await executeQuery(`SELECT * FROM User WHERE nim = "${nim}"`);
        if (hasil.length == 0) {
            return res.status(200).send({"Pesan": "User tidak ditemukan!"});
        }
        const user = hasil[0];
        if (user.nama == nama && user.ymd == ymd) {
            const token = jwt.sign(
                {
                    "nim": user.nim,
                    "nama": user.nama,
                    "ymd": user.ymd
                },
                secret,
                {
                    "expiresIn" : 3600
                }
            );
            return res.status(200).send({"token": token});
        }
        return res.status(200).send({"Pesan": "Nama/Tanggal lahir tidak sesuai!"});
    }
    catch (err) {
        return res.status(500).send(err);
    }
})

app.post("/api/tambah_user", CekToken, async function (req, res) {
    const schema =  Joi.object({
        "nim": Joi.string().regex(/^[0-9]{10}$/).required().messages({
            "any.required": "NIM harus disertakan!",
            "string.empty": "NIM wajib diisi!",
            "string.pattern.base": "NIM harus memiliki 10 angka!"
        }),
        "nama": Joi.string().max(255).required().messages({
            "any.required": "Nama harus disertakan!",
            "string.empty": "Nama wajib diisi!",
            "string.max": "Nama harus memiliki panjang maksimal 255 karakter!"
        }),
        "ymd": Joi.string().regex(/^[0-9]{8}$/).required().messages({
            "any.required": "YMD harus disertakan!",
            "string.empty": "YMD wajib diisi!",
            "string.pattern.base": "YMD harus memiliki 8 angka!"
        })
    });
    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    try {
        const nim = req.body.nim;
        const nama = req.body.nama;
        const ymd = req.body.ymd;
        const hasil = await executeQuery(`SELECT * FROM User WHERE nim = "${nim}"`);
        if (hasil.length > 0) {
            return res.status(200).send({"Pesan": "User sudah ada!"});
        }
        await executeQuery(`INSERT INTO User VALUES (0, "${nim}", "${nama}", "${ymd}")`);
        return res.status(200).send({"Pesan": "User berhasil ditambahkan!"});
    }
    catch (err) {
        return res.status(500).send(err);
    }
});

app.put("/api/ubah_user/:nim", CekToken, async function (req, res) {
    ValidasiParamNIM(req);
    const schema =  Joi.object({
        "nama": Joi.string().max(255).required().messages({
            "any.required": "Nama harus disertakan!",
            "string.empty": "Nama wajib diisi!",
            "string.max": "Nama harus memiliki panjang maksimal 255 karakter!"
        }),
        "ymd": Joi.string().regex(/^[0-9]{8}$/).required().messages({
            "any.required": "YMD harus disertakan!",
            "string.empty": "YMD wajib diisi!",
            "string.pattern.base": "YMD harus memiliki 8 angka!"
        })
    });
    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
        return res.status(400).send({"Pesan": validationResult.error.details[0].message});
    }
    try {
        const nim = req.params.nim;
        const nama = req.body.nama;
        const ymd = req.body.ymd;
        const hasil = await executeQuery(`SELECT * FROM User WHERE nim = "${nim}"`);
        if (hasil.length == 0) {
            return res.status(200).send({"Pesan": "User tidak ditemukan!"});
        }
        await executeQuery(`UPDATE User SET nama = "${nama}", ymd = "${ymd}" WHERE nim = "${nim}"`);
        return res.status(200).send({"Pesan": "User berhasil diubah!"});
    }
    catch (err) {
        return res.status(500).send(err);
    }
});

app.delete("/api/hapus_user/:nim", CekToken, async function (req, res) {
    ValidasiParamNIM(req);
    try {
        const nim = req.params.nim;
        const hasil = await executeQuery(`SELECT * FROM User WHERE nim = "${nim}"`);
        if (hasil.length == 0) {
            return res.status(200).send({"Pesan": "User tidak ditemukan!"});
        }
        await executeQuery(`DELETE FROM User WHERE nim = "${nim}"`);
        return res.status(200).send({"Pesan": "User berhasil dihapus!"});
    }
    catch (err) {
        return res.status(500).send(err);
    }
});

app.get("/api/cari_nama_user", CekToken, CekQueryNama, async function (req, res) {
     try {
        const nama_cari = req.query.nama;
        const data_api = await axios.get("https://bit.ly/48ejMhW");
        const data = data_api.data;
        const arr = data.DATA.split("\n");
        const headers = arr.shift().split("|");
        const nim_index = headers.indexOf("NIM");
        const nama_index = headers.indexOf("NAMA");
        const ymd_index = headers.indexOf("YMD");
        let hasil = [];
        for (let i = 0; i < arr.length; i++) {
            const v = arr[i].split("|");
            if (v.length == 3) {
                const nim = v[nim_index];
                const nama = v[nama_index];
                const ymd = v[ymd_index];
                if (nama.toLowerCase().includes(nama_cari.toLowerCase())) {
                    hasil.push({"NIM": nim, "NAMA": nama, "YMD": ymd});
                }
            }
        }
        return res.status(200).send(hasil);
    }
    catch (err) {
        return res.status(500).send(err);
    }
});

app.get("/api/cari_nim_user", CekToken, CekQueryNIM, async function (req, res) {
    try {
        const nim_cari = req.query.nim;
        const data_api = await axios.get("https://bit.ly/48ejMhW");
        const data = data_api.data;
        const arr = data.DATA.split("\n");
        const headers = arr.shift().split("|");
        const nim_index = headers.indexOf("NIM");
        const nama_index = headers.indexOf("NAMA");
        const ymd_index = headers.indexOf("YMD");
        let hasil = [];
        for (let i = 0; i < arr.length; i++) {
            const v = arr[i].split("|");
            if (v.length == 3) {
                const nim = v[nim_index];
                const nama = v[nama_index];
                const ymd = v[ymd_index];
                if (nim.toLowerCase().includes(nim_cari.toLowerCase())) {
                    hasil.push({"NIM": nim, "NAMA": nama, "YMD": ymd});
                }
            }
        }
        return res.status(200).send(hasil);
    }
    catch (err) {
        return res.status(500).send(err);   
    }
});

app.get("/api/cari_ymd_user", CekToken, CekQueryYMD, async function (req, res) {
    try {
        const ymd_cari = req.query.ymd;
        const data_api = await axios.get("https://bit.ly/48ejMhW");
        const data = data_api.data;
        const arr = data.DATA.split("\n");
        const headers = arr.shift().split("|");
        const nim_index = headers.indexOf("NIM");
        const nama_index = headers.indexOf("NAMA");
        const ymd_index = headers.indexOf("YMD");
        let hasil = [];
        for (let i = 0; i < arr.length; i++) {
            const v = arr[i].split("|");
            if (v.length == 3) {
                const nim = v[nim_index];
                const nama = v[nama_index];
                const ymd = v[ymd_index];
                if (ymd.toLowerCase().includes(ymd_cari.toLowerCase())) {
                    hasil.push({"NIM": nim, "NAMA": nama, "YMD": ymd});
                }
            }
        }
        return res.status(200).send(hasil);
    }
    catch (err) {
        return res.status(500).send(err);   
    }
});

app.listen(port, function(){
    console.log(`Listening on port ${port}...`);
});