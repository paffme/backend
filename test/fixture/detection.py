#!/usr/bin/python

import sys, argparse

def main(argv):
   parser = argparse.ArgumentParser()
   parser.add_argument("export")
   parser.add_argument("--weights")
   parser.add_argument("--image")
   parser.add_argument("--file_save")
   args = parser.parse_args()

   weights = args.weights
   image = args.image
   file_save = args.file_save

   print('Weights is ' + weights)
   print('Image is ' + image)
   print('File save is ' + file_save)

   if len(weights) == 0:
     print("no weights")
     sys.exit(1)

   if len(image) == 0:
     print("no image")
     sys.exit(1)

   if len(file_save) == 0:
     print("no file save")
     sys.exit(1)

   with open(file_save, 'w') as output:
       output.write('[[1, 2, 3, 4]]')

   sys.exit(0)

if __name__ == "__main__":
   main(sys.argv[1:])