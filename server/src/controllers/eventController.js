import express from "express";
import event from "../models/event.js"

export const createEvent = async (req,res) => {
    try{
        const {title, description, date, address, createdBy} = req.body;
        const newEvent = new event({title, description, date, address, createdBy});
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    }
    catch(error){
        res.status(400).json({message : error.message})
    }
};

export const getEvents = async (req,res) => {
    try{
        const events = await event.find();
        res.status(200).json(events);
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
};

export const getEventbyId = async (req,res) => {
    try {
        const findEvent = await event.findById(req.params.id);
        res.status(200).json(findEvent);
    } catch (error) {
       res.status(500).json({message: error.message }); 
    }
};

export const updateEvent = async (req,res) => {
    try {
        const updateEvent = await event.findByIdAndUpdate(req.params.id, req.body, {new : true});
        if (!updateEvent){
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json({message : "Event updated"});
    } catch (error) {
        res.status(500).json({ message : error.message });
    }
};

export const deleteEvent = async (req,res) => {
    try {
        const deleteEvent = await event.findByIdAndDelete(req.params.id);
        if(!deleteEvent){
            return res.status(404).json({ message: "Event not found"})
        }
        res.status(200).json({ message : "Event successfully deleted"});
    } catch (error) {
        res.status(500).json({ message : error.message });
    }
};