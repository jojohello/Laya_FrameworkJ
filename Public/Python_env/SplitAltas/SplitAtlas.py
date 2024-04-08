print("开始切分图片")

import cv2
import numpy as np
import os

# # 转换为RGBA格式
# rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)

# # 寻找轮廓
# contours, _ = cv2.findContours(rgba_image[:, :, 3], cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# # 遍历每个轮廓
# for i, contour in enumerate(contours):
#     # 计算边界框
#     x, y, w, h = cv2.boundingRect(contour)
    
#     # 切分图片并导出小图
#     block = rgba_image[y:y+h, x:x+w]
#     cv2.imwrite(f'block_{i}.png', block)

##########################################################################################################

# # 转换为灰度图
# gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# # 使用Canny边缘检测算法
# edges = cv2.Canny(gray_image, 100, 200)

# # 寻找轮廓
# contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# # 遍历每个轮廓
# for i, contour in enumerate(contours):
#     # 计算边界框
#     x, y, w, h = cv2.boundingRect(contour)
    
#     # 切分图片并导出小图
#     block = image[y:y+h, x:x+w]
#     cv2.imwrite(f'block_{i}.png', block)
##########################################################################################################


def SplitAltas(path:str):
    # 读取图集图片
    image = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    # 寻找轮廓
    contours, _ = cv2.findContours(image[:, :, 3], cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    curPath = os.getcwd() + '/' + os.path.splitext(path)[0] + '/'
    #print(f'当前文件夹位置为：{curPath}')

    if not os.path.exists(curPath):
        os.makedirs(curPath)

    # 遍历每个轮廓
    for i, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        
        # 检查块中所有像素的alpha通道值
        block_alpha = image[y:y+h, x:x+w, 3]
        if np.all(block_alpha == 0):
            continue
    
        # 切分图片并导出小图
        block = image[y:y+h, x:x+w]
        cv2.imwrite(f'{curPath}/{i}.png', block)
    
    print(f'切分图片{path}完成！')


for file_name in os.listdir('./'):
    if file_name.endswith('.png') or file_name.endswith('.jpg'):
        print(file_name)
        SplitAltas(file_name)


print("图块导出完成！")