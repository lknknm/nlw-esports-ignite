import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

// To test data structure you can reference Hoppscotch file with the fields below.
// Games listing array with ads counting
app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select:{
                    ads: true,
                }
            }
        }
    })

    return response.json(games);
})

// Game ad creation. Response using HTTP 201 status code
app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body: any = request.body;

    
// Further validation to be implemented using Zod.js

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourStringToMinutes(body.hourStart),
            hourEnd: convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
})

// Ads listing per Game
app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createAd: 'desc', // Further note: 'createAd' may be replaced to 'createdAt'
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd),
        }
    }))
})


// Discord listing per Ad
app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    })
    
    return response.json({
        discord: ad.discord,
    })
})

// localhost:3333
app.listen(3333)