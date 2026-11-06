const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Book = sequelize.define("Book", {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER
    },
    coverUrl: {
        type: DataTypes.STRING
    }
}, {
    tableName: "books",
    timestamps: true
});

module.exports = Book;