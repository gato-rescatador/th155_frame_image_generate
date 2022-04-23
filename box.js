const sharp = require("sharp");
const character = 'ichirin'
// some num code i found in the data(maybe not correct)
// 1000-4a    1100-5a        1210-2a     1220-8a     1230-6a
// 1500-d4a   1600-d5a       1710-d2    1720-d8a    1730/1740-d6a   1300-da
//            1101/1110-j5a  1211-j2a    1221-j8a    1231-j6a
//                           1741-6dj2a  1750-6dj8a                  1310/11-db
// 1800/2-grab/hit
// 2000-5b    2010-6b    2020-hb
// 2001-j5b
// 2500/1/2/-ab
// 3000-sp    3010/1
// 3020-4c    3040-5c    3000/1/5-2c     3010-8c      3030-j6c
//                                       3011/2-j8c   3031/2/5/8/3/4/30/50-6c
// 4000-sc1   4010-sc2   4020-sc3
const motionID = 1220
const outputDir = 'j8aWithNotOnlyOneLayerButFilter'
// use this to control the output size freely.
const [xOffset, yOffset] = [0, 200];
const [width, height] = [80, yOffset + 0];
const {MongoClient} = require("mongodb");
const fs = require("fs");
const client = new MongoClient("mongodb://localhost:27017")
client.connect().then()
// im lazy so i used mongodb
const db = client.db("aocf");
// character json, got from read_pat.exe in 135tk
const elems = require(`./data/${character}.json`)['textures']['1']
const motions = require(`./data/${character}.json`)['surfaces']

// generate the dir
fs.access(`./cache`, fs.constants.F_OK, async (err) => {
    if (err) fs.mkdir(`./cache`, () => console.log(`created dir: ./cache`))
});
fs.access(`./output`, fs.constants.F_OK, async (err) => {
    if (err) fs.mkdir(`./output`, () => console.log(`created dir: ./output`))
});


//use the two function to input the elem and motion obj into mongodb
// table name: aocf, collection name: elems / motions
async function updateElem() {
    for (let i = 1; i <= elems['nb_elems']; i++) {
        let elem = elems[`elem_${i}`]
        elem.character = character
        elem.id = i
        await db.collection('elems').updateOne({id: elem.id, character: character}, {$set: elem}, {upsert: true})
        console.log(i)
    }
}

async function updateMotion() {
    for (let i = 1; i <= motions['nb_take']; i++) {
        let motion = motions[`${i}`]
        motion.character = character
        motion.id = i
        await db.collection('motions').updateOne({id: motion.id, character: character}, {$set: motion}, {upsert: true})
        console.log(i)
    }
}

// updateElem().then();
// updateMotion().then();


// // main function
getInfo({
    motionID: motionID
}).then((frames) => {
    for (let i = 0; i < frames.length; i++) draw(frames[i], `${outputDir}_${i}`).then();
    client.close().then()
})


async function draw({
                        elems, collision, hurt, hit
                    }, outputName = undefined) {
    try {
        let bg = await sharp('./img/bg.png')
        fs.access(`./output/${character}`, fs.constants.F_OK, async (err) => {
            if (err) fs.mkdir(`./output/${character}`, () => console.log(`created dir: ./output/${character}`))
        });
        fs.access(`./output/${character}/${outputDir}`, fs.constants.F_OK, async (err) => {
            if (err) fs.mkdir(`./output/${character}/${outputDir}`, () => console.log(`created dir: ./output/${character}/${outputDir}`))
        });
        for (let elemIndex in elems) {
            console.log(elems[elemIndex].source)
            await bg.composite([
                {
                    input: elems[elemIndex].source,
                    top: yOffset,
                    left: xOffset,
                },
            ]).toFile(`./cache/${outputName + '_cache' + elemIndex + '_'}_.png`)
            bg = await sharp(`./cache/${outputName + '_cache' + elemIndex + '_'}_.png`);
        }
        await (async (source, x, y, m30, m31) => {
            const sourceBuffer = await sharp(source)
            let svg = ''
            for (const unk of collision) {
                console.log(`x:${x - m30 - unk[0] + unk[2] + xOffset} y:${y - m31 - (unk[1]) + (unk[3]) + yOffset}`)
                svg += `<rect x="${x - m30 - unk[0] + unk[2] + xOffset}" y="${y - m31 - (unk[1]) + (unk[3]) + yOffset}" width="${unk[0] * 2 - 1}" height="${(unk[1]) * 2 - 1}" stroke="blue" fill="transparent" stroke-width="1px"/>`
            }
            for (const unk of hurt)
                svg += `<rect x="${x - m30 - unk[0] + unk[2] + xOffset}" y="${y - m31 - (unk[1]) + (unk[3]) + yOffset}" width="${unk[0] * 2 - 1}" height="${(unk[1]) * 2 - 1}" stroke="#00FF00" fill="transparent" stroke-width="1px"/>`
            for (const unk of hit)
                svg += `<rect x="${x - m30 - unk[0] + unk[2] + 1 + xOffset}" y="${y - m31 - (unk[1]) + (unk[3]) + yOffset}" width="${unk[0] * 2 - 1}" height="${(unk[1]) * 2}" stroke="red" fill="transparent" stroke-width="1px"/>`
            const svgImage = `<svg width="${1920}" height="${1080}">${svg}</svg>`;
            const svgBuffer = Buffer.from(svgImage);
            let image = await sharp(`./cache/${outputName + '_cache' + (elems.length - 1) + '_'}_.png`)
            await image
                .composite([
                    {
                        input: svgBuffer,
                        top: 0,
                        left: 0,
                    },
                ])
                .toFile(`./cache/${outputName + '_'}_.png`)
            await sharp(`./cache/${outputName + '_'}_.png`)
                .extract({
                    left: 0,
                    top: 0,
                    width:
                        (await sourceBuffer.metadata())['width'] +
                        width,
                    height:
                        (await sourceBuffer.metadata())['height'] +
                        height
                })
                .toFile(`./output/${character}/${outputDir}/${outputName ? outputName : source + '_'}_.png`)
        })(elems[0].source, elems[0].x, elems[0].y, elems[0].m30, elems[0].m31)
        // use elem[0] only, undone part. need to select the correct layer...
    } catch (error) {
        console.log(error);
    }
}


async function getInfo({motionID}) {
    const motions = [];
    let motion = await db.collection('motions').findOne({unk1: motionID, character: character})
    do {
        motions.push(motion)
        motion = await db.collection('motions').findOne({id: motion.id + 1, character: character})
    } while (motion['unk1'] === 4294967294)
    const frames = []
    let frame = -1;
    for (motion of motions) {
        for (let i = 1; i <= motion['nb_frame']; i++) {
            frame++
            const [elems, collision, hurt, hit] = [[], [], [], []];
            for (let j = 1; j <= motion[`frame_${i}`]['frame_subentry1_1']['nb_child']; j++) {
                let child = motion[`frame_${i}`]['frame_subentry1_1'][`child_${j}`]
                collision.push([child['unk2'], child['unk3'], child['unk4'], child['unk5']])
            }
            for (let j = 1; j <= motion[`frame_${i}`]['frame_subentry1_2']['nb_child']; j++) {
                let child = motion[`frame_${i}`]['frame_subentry1_2'][`child_${j}`]
                hurt.push([child['unk2'], child['unk3'], child['unk4'], child['unk5']])
            }
            for (let j = 1; j <= motion[`frame_${i}`]['frame_subentry1_3']['nb_child']; j++) {
                let child = motion[`frame_${i}`]['frame_subentry1_3'][`child_${j}`]
                hit.push([child['unk2'], child['unk3'], child['unk4'], child['unk5']])
            }
            console.log(`frame: ${frame} nb_layer: ${motion['nb_layer']}`)
            for (let k = 1; k <= motion['nb_layer']; k++) {
                let elem = (await db.collection('elems').findOne({
                    id: motion[`layer_${k}`][`element_${i}`]['name'] + 1,
                    character: character
                }))
                if (elem === null) continue;
                console.log(`current layer: ${k} / layer path: ${elem['path']}`)
                // a simple and dirty way to solve layer problem -- if im not quite lazy
                if (elem['path'].toLowerCase().includes('effect')) continue;
                if (elem['path'].toLowerCase().includes('unzan')) continue;
                if (elem['path'].toLowerCase().includes('hand')) continue;
                if (elem['path'].toLowerCase().includes('head')) continue;
                if (elem['path'].toLowerCase().includes('ball')) continue;
                if (elem['path'].toLowerCase().includes('test')) continue;
                if (elem['path'].toLowerCase().includes('skill_cushion0')) continue;
                elems.push({
                    source: `./actor/${character}/${elem['path'].replace(/[.]\S+$/, '')}.png`,
                    x: elem['x'],
                    y: elem['y'],
                    m30: motion[`layer_${k}`][`element_${i}`]['matrix[3][0]'],
                    m31: motion[`layer_${k}`][`element_${i}`]['matrix[3][1]'],
                    unk: [motion[`layer_${k}`]['unk2'], motion[`layer_${k}`]['unk3'], motion[`layer_${k}`]['unk4'], motion [`layer_${k}`]['unk5']]
                })
            }
            frames.push({
                elems: elems,
                collision: collision,
                hurt: hurt,
                hit: hit,
            })
        }
    }
    return frames
}