import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    roll: { 
      type: String, 
      required: true, 
      unique: true,
      maxlength: [10, 'Roll number cannot exceed 10 characters'],
      validate: {
        validator: function(v) {
          return /^[A-Za-z0-9]{1,10}$/.test(v);
        },
        message: 'Roll number must be alphanumeric and up to 10 characters'
      }
    },
    branch: { type: String, enum: ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'], required: true },
    division: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    classYear: { type: String, enum: ['FE', 'SE', 'TE', 'BE'], required: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
