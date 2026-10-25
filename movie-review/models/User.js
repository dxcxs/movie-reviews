const { Schema, model } = require('mongoose');

module.exports = model('User', new Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  password: { type: String, required: true },           // bcrypt hash
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Movie' }]
}, { timestamps: true }));
