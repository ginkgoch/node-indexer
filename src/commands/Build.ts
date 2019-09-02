import path from "path";
import fs from "fs";
import * as yargs from "yargs";
import GKMapKit, { RTIndex, RTRecordType, ShapefileType } from 'ginkgoch-map';
import { Feature, Point } from "ginkgoch-geom";

const INDEX_EXTENSIONS = ['.idx', '.ids']

export function buildIndex(args: yargs.Arguments<{}>) {
    const sourcePath = <string>args.s;
    if (!fs.existsSync(sourcePath)) {
        console.log('[Error] Source file not exists.');
        return;
    }

    console.log(`Start building index. Collecting... `);

    if (isDir(sourcePath)) {
        buildIndexForDirectory(sourcePath, args)
    }
    else {
        buildIndexForFile(sourcePath, args);
    }
}

function isDir(filePath: string): boolean {
    const state = fs.lstatSync(filePath);
    return state.isDirectory();
}

function buildIndexForDirectory(sourceDir: string, args: yargs.Arguments<{}>) {
    const sourcePaths = fs.readdirSync(sourceDir).filter(f => f.endsWith('.shp')).map(f => path.join(sourceDir, f));
    console.log(`[0/${sourcePaths.length}] Building index for directory ${sourceDir}`);

    let output = args.o;
    if (output !== undefined && typeof output === 'string' && fs.lstatSync(output).isFile()) {
        output = path.dirname(output);
    }

    let i = 0;
    for (let sourcePath of sourcePaths) {
        console.log(`[${i + 1}/${sourcePaths.length}] Building index for file ${path.basename(sourcePath)}`);
        const tmpOutput = parseOutput(sourcePath, output);
        _buildIndexForFile(sourcePath, tmpOutput);
        console.log(`[${i + 1}/${sourcePaths.length}] Built index for file ${path.basename(sourcePath)}`);
        console.log();
        i++;
    }

    console.log('Building index completed.');
}

function buildIndexForFile(sourcePath: string, args: yargs.Arguments<{}>) {
    const output = parseOutput(sourcePath, args.o);
    const overwrite = args.rw as boolean;
    console.log(overwrite);
    const outputExists = fs.existsSync(output);
    if (outputExists && !overwrite) {
        console.log('[Skip] Output exists and overwrite not enabled, skip building index.');
        return;
    }

    if (overwrite) {
        cleanExistingIndexFiles(output);
    }

    console.log('Start building index for', path.basename(sourcePath));
    _buildIndexForFile(sourcePath, output);
    console.log('Index built completed.');
}

function _buildIndexForFile(sourcePath: string, targetPath: string) {
    const shapefile = new GKMapKit.layers.Shapefile(sourcePath);
    shapefile.open();

    const recordType = shapefile.shapeType() === ShapefileType.point ? RTRecordType.point : RTRecordType.rectangle;
    const recordCount = shapefile.count();
    const pageSize = RTIndex.recommendPageSize(recordCount);

    RTIndex.create(targetPath, recordType, { pageSize });
    const index = new RTIndex(targetPath, 'rs+');
    index.open();

    try {
        let i = 0;
        const iterator = shapefile.iterator({ fields: [] });
        while (!iterator.done) {
            let record = iterator.next();
            if (record.hasValue && record.value !== null) {
                pushIndexRecord(index, record.value!, recordType);
                i++;

                if (i % 32 === 0) {
                    process.stdout.write(`[Building] - ${i}/${recordCount}\r`);
                }
            }
        }

        console.log(`[Done] ${path.basename(sourcePath)} index with ${index.count()} records build complete.`);
    }
    catch (ex) {
        console.log('[Error]', ex);
        cleanExistingIndexFiles(targetPath);
    } 
    finally {
        shapefile.close();
        index.close();
    }
}

function pushIndexRecord(index: RTIndex, feature: Feature, recordType: RTRecordType): void {
    if (recordType === RTRecordType.rectangle) {
        const geom = feature.envelope();
        index.push(geom, feature.id.toString());
    }
    else {
        const center = feature.envelope().centroid();
        const geom = new Point(center.x, center.y)
        index.push(geom, feature.id.toString());
    }
}

function parseOutput(sourcePath: string, o: unknown) {
    let output = '';
    if (o !== undefined) {
        output = o as string;
    }
    else {
        output = path.dirname(sourcePath);
    }

    if (isDir(output)) {
        const basename = path.basename(sourcePath);
        const basenameIdx = changeExtension(basename, '.idx');
        return path.join(output, basenameIdx);
    }
    else {
        return output;
    }
}

function changeExtension(fileName: string, newExtension: string) {
    const ext = path.extname(fileName);
    return fileName.replace(ext, newExtension);
}

function cleanExistingIndexFiles(filePath: string) {
    INDEX_EXTENSIONS.forEach(ext => {
        const temp = changeExtension(filePath, ext);
        if (fs.existsSync(temp)) {
            fs.unlinkSync(temp);
        }
    });
}