Assuming our screen width is 1000px and we have some collection of images, we need to create rows that each sum to 1000px in width, our height can be adjusted if necessary. To avoid a row being too large or small lets stay between 185-250px.

Our approach will go through images one at a time calculate their width range after applying the height transformation. We will continue to add images to the row until the bounds of our range surrounds the container width.

- An image can be scaled down but can not be scaled up.
- We will ignore gutters for now to simplify the calculations

images[0]
800x600 -> 333.33x250 upper bound
-> 246.66x185 lower bound
-> [246, 333]

Check, does upper bound exceed container size — 1000? If so, you have row
It doesn’t so let’s calculate another image.

images[1]
585x250 -> 585x250 upper
-> 432.89x185
-> [432, 585]

Now we add the bounds in our accumulator

[246, 333]

- [432, 585]
  —————
  [678, 918]

Check, does upper bound exceed container size — 1000?
It doesn’t so let’s calculate another image.

images[2]
1250x650 -> 480.76x250
-> 355.76x185
-> [355, 480]

Now we add the bounds in our accumulator

[678, 918]

- [355, 480]
  —————
  [1,033, 1,398]

Immediately we hit an edge-case—both bounds exceed our container. This combination of images is not compatible with the container size.
To solve this edge-case, we need to look ahead in our collection until we find a compatible image. Let’s look-ahead and try another image.

images[3]
750x350 -> 535.71x250
-> 396.42x185
-> [396, 537]

[678, 918]

- [432, 585]
  —————
  [1,110, 1,503]

Unlucky, let’s go again. This one’s gonna be a square image because I’m sick of doing arithmetic!

images[4]
750x750 -> 250x250
-> 185x185
-> [185, 250]
[678, 918]

- [185, 250]
  —————
  [863, 1,168]

Excellent. Our bound surrounds the container width (1000px), which means we can scale down the column to fit 1000px exactly. Let’s calculate the height that corresponds with 1000px width.

W 863 x H 185
W 1168 x H 250
W 1000 x H ???
-> 1000 / 1168 = 0.8561643836
-> 250 \* 0.8561643836 = 214.0410959
-> H 214.0410959

We will take our final height 214px (that corresponds to our container’s 1000px width) and use that to transform each image in our row.

The images with the following resolutions before and after their transformations

images[0]: 800x600 -> 285.333333329x214
images[1]: 585x250 -> 500.7599999852x214
images[4]: 750x750 -> 214x214

To confirm: 285 + 500 + 214 = 999!!!!!!!!!!!!!!! (Ignore my rounding please hehe!)

---

Algorithm

- For each image
- Calc bound lower and upper bounds from min & max heights \* aspectRatio
- Add to current row lower and upper bounds
- new bounds surround container width? _commit row_
- upper bound is lower than container width? -> _commit image to row and add key to set_

Different idea: Track multiple rows and append to the first row that the image fits in

- If an image does not fit in the pending row, create a new row and append the image to the first row
