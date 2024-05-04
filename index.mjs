import mustache from 'mustache';
import { $, cd } from 'zx';
import { readFile, writeFile } from "fs/promises";
import got from "got";

main();

async function main() {
    const { GITHUB_EVENT_NAME } = process.env;

    console.info(`GITHUB_EVENT_NAME: ${GITHUB_EVENT_NAME}`);

    if (GITHUB_EVENT_NAME == 'schedule' && Math.random() > 0.2) {
        console.info("decided to not proceed.")
        return
    }

    // await $`rm -rf dist`;
    // await $`mkdir -p dist`;

    var readme = mustache.render(
        await readFile('template.md', 'utf-8'),
        {
            listening: await getListening(),
            updated: new Date().toISOString()
        }
    );
    await writeFile('dist/README.md', readme, 'utf-8');

    // await $`cp -r .git dist/`;

    await $`cp -r .github dist/`;

    cd('dist');

    // try { await $`git branch -D main`; } catch { }
    // await $`git checkout --orphan main`;
    await $`git add .`;
    await $`git config user.name lideming && git config user.email me@yuuza.net`;
    await $`git commit -m "Update from CI"`;
    await $`git push`;
}

async function getListening() {
    var resp = await got('https://mc.yuuza.net/api/users/1/stat');
    var json = JSON.parse(resp.body);
    var track = json.lastPlayTrack;
    var str = 'He ';
    var timepass = Date.now() - new Date(json.lastPlayTime);
    // if (timepass < 1000 * 60 * 5)
    //     str += 'is listening to ';
    // else
    //     str += 'was listening to ';
    str += 'was listening to ';
    if (track)
        str += `*${escapeMD(track.name)}* by *${escapeMD(track.artist)}* `;
        // str += `[${escapeMD(track.name)} <span style="color: gray">by</span> ${escapeMD(track.artist)}](https://mc.yuuza.net/#track/${track.id}) `;
    else
        str += 'unknown music ';
    // str += `(${formatTime(timepass)} ago).`;
    str += 'recently.';
    return str;
}

function formatTime(ms) {
    var unit = ['sec', 'min', 'hr', 'day'];
    var step = [1000, 60, 60, 24];
    var val = ms / step[0];
    var cur = 1;
    while (cur < unit.length && val >= step[cur]) {
        val /= step[cur];
        cur++;
    }
    return val.toFixed(0) + ' ' + unit[cur - 1];
}

function escapeMD(str) {
    return str.replace(/[\[\]*_<>&]/g, x => '\\' + x);
}
