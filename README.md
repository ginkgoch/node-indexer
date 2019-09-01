# ShapeFile Indexer Command Line Tool
This is a command line tool for building index for shapefiles.

## Install
Follow few steps below to set your project.

```
yarn global add ginkgoch-indexer
```

## Help

#### General
```bash
Commands:
  ginkgoch-indexer build  Build spatial index for a specific shapefile or all
                          shapefiles in a folder

Options:
  -h  Show help                                                        [boolean]
  -v  Show version number                                              [boolean]
```

#### Build
```bash
Build spatial index for a specific shapefile or all shapefiles in a folder

Options:
  -h               Show help                                           [boolean]
  -v               Show version number                                 [boolean]
  --source, -s     The source file or directly path to build index    [required]
  --output, -o     The destination file or folder to store generated index files
  --overwrite, -w  Overwrite the files if exist       [boolean] [default: false]
```

