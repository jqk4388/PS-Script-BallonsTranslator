import json
import os
import tkinter as tk
import sys
from tkinter import filedialog

global page_width
global page_height

# 页面宽度和高度定义
def extract_text_and_translation(json_file, page_width_value, page_height_value):
    # 打开并加载 JSON 文件
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    page_width = int(page_width_value)
    page_height = int(page_height_value)

    # 获取目录路径（JSON中的路径）
    directory = data.get("directory", "")

    # 获取保存 TXT 文件的目录
    output_dir = os.path.dirname(json_file)

    # 创建输出目录（如果不存在）
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 遍历页面
    output_text = []  # 用于存储输出的内容
    for image_name, items in data.get("pages", {}).items():
        # 写入页面标题
        output_text.append(f">>>>>>>>[{image_name}]<<<<<<<<\n")

        # 遍历每一条文本项，获取坐标和翻译
        for idx, item in enumerate(items):
            if "text" in item and "translation" in item:
                # 获取左上角的坐标（xyxy 中的前两个值）
                coord = item.get("xyxy", [])
                if len(coord) >= 2:
                    coord = coord[:2]  # 只保留前两个坐标
                    # 将坐标转化为比例
                    coord = [coord[0] / page_width, coord[1] / page_height, 1]

                text = item["text"]
                translation = item["translation"]

                # 添加格式化的文本到输出列表
                output_text.append(f"----------------[{idx + 1}]----------------{coord}\n")
                # output_text.append(f"{text[0]}\n")
                output_text.append(f"{translation}\n")

    # 获取输出的 TXT 文件路径
    output_file = os.path.join(output_dir, "translations.txt")

    # 将内容写入文件
    with open(output_file, 'w', encoding='utf-8') as f_out:
        f_out.write("1,0\n-\n框内\n框外\n-\n备注备注备注\n")
        f_out.writelines(output_text)

    print(f"翻译文本已保存到: {output_file}")


def choose_json_file():
    # 使用 tkinter 打开文件选择对话框
    root = tk.Tk()
    root.withdraw()  # 隐藏主窗口
    json_file = filedialog.askopenfilename(
        title="选择 JSON 文件",
        filetypes=[("JSON Files", "*.json")]
    )
    return json_file


def main():
    # 获取命令行参数列表
    args = sys.argv

    # 判断是否有足够的参数
    if len(args) > 1:
        # 获取参数
        page_width = args[1]
        page_height = args[2]
        # 打印参数
        print(f"页面宽度: {page_width}px")
        print(f"页面高度: {page_height}px")
    else:
        print(f"没有传递参数")

    # 用户选择 JSON 文件
    json_file = choose_json_file()

    if not json_file:
        print("未选择文件，程序退出")
        return

    # 提取文本和翻译并保存到 txt 文件
    extract_text_and_translation(json_file, page_width, page_height)


if __name__ == "__main__":
    main()
