

import {Router} from "express";
import {cacheService} from "../services/cachedService.js";

const router = Router();

router.get('/stats', async (req, res) => {
    try{
    if(process.env.NODE_ENV === 'production'){
        return res.status(403).json({
            message: "Cache stats is forbidden in production.",
            error: true
        })
    }

    const stats = await cacheService.getStats()
        const isConnected = cacheService.isConnected()

        return res.status(200).json({
            connected: isConnected,
            stats: stats,
            ttl: cacheService.TTL
        })

    }catch(err){
        return res.status(500).json({
            message: err.message,
            error: err.error
        })
    }
})

router.delete('/clear', async (req, res) => {
    try{
       if(process.env.NODE_ENV === 'production'){
           return res.status(403).json({
               message: "Cache stats is forbidden in production.",
           })
       }

       await cacheService.clearAll()

        res.json({
            message: "Cache cleared successfully.",
        })
    }catch (err){
        res.status(500).json({
            message: err.message,
            error: err.error
        })
    }
})

router.delete('/pattern/:pattern', async (req, res) => {
    try{
        if(process.env.NODE_ENV === 'production'){
            return res.status(403).json({
                message: "Cache pattern is forbidden in production.",
                error: true
            })
        }

        const {pattern} = req.params

        await cacheService.deletePattern(pattern)
        res.json({
            message: `Cache pattern has been deleted successfully for ${pattern}`,
        })
    }catch(err){
    res.status(500).json({
        message: err.message,
        error: err.error
    })
    }
})

router.get('/get/:key', async (req, res) => {
    try{
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Cache inspection not allowed in production'
        });
    }
    const {key} = req.params
    const value = await cacheService.get(key)
    if(value) {
        return res.status(200).json({
            key,
            value,
            cached: true
        })
    }else{
        return res.status(404).json({
            key,
            cached: false
        })
    }
    }catch (err){
        res.status(500).json({
            message: err.message,
            error: err.error
        })
    }
})

export default router;