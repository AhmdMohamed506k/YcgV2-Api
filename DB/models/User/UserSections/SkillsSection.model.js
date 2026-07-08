import mongoose, { Schema, model } from 'mongoose';

const skillsSchema = new Schema({
    skills: [{
        name: { type: String, required: true },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
        experienceYears: { type: Number, default: 0 }
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'user', 
        required: true 
    }
}, { timestamps: true });

export const SkillsSectionModel = model('Skills', skillsSchema);