#!/bin/bash 
# FOR TESTING PURPOSES ONLY, NOT RELATED TO DOCKER IMAGE BUILD
# Can be used for projects without tsconfig.json file
# This script generates tsconfig.json file, it looks for all files with extension .ts and adds them to the file section. 
# Old tsconfig.json file, if exists is saved with .ol.timestamp extension

FILE_NAME="tsconfig.json"

if [ -f $FILE_NAME ];
then
  timestamp=$(date +%s)
  mv $FILE_NAME "$FILE_NAME.old.$timestamp"
fi

echo "{
  \"compilerOptions\": {
    \"module\": \"commonjs\",
    \"target\": \"es5\",
    \"outDir\": \".bin\"
  },
  \"files\": [" >> $FILE_NAME

for file in $(find . -name *.ts)
do
  echo "\"$file\"", >> $FILE_NAME
done

sed -i.bk "$ s/.$//" $FILE_NAME 

echo "]}" >> $FILE_NAME
 
rm -rf $FILE_NAME.bk
