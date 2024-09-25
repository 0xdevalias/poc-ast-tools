#!/usr/bin/env python

# TODO: It would be interesting to see how this TfidfVectorizer + cosine_similarity method compares with using difflib's SequenceMatcher + ratio methods:
#   https://docs.python.org/3/library/difflib.html#sequencematcher-objects
#   See also:
#     https://docs.python.org/3/library/difflib.html#difflib.get_close_matches
#       Return a list of the best “good enough” matches. word is a sequence for which close matches are desired (typically a string), and possibilities is a list of sequences against which to match word (typically a list of strings).

# TODO: This ChatGPT chat has some examples of how to calculate this sort of thing in JavaScript:
#   https://chatgpt.com/c/7fef26fd-0531-4079-b508-43904ff3e089
#   See also:
#     https://github.com/NaturalNode/natural/
#       https://naturalnode.github.io/natural/
#       https://blog.logrocket.com/natural-language-processing-node-js/
#     https://winkjs.org/
#       https://winkjs.org/wink-nlp/bm25-vectorizer.html
#         BM25 is a major improvement over the classical TF-IDF based algorithms. The weights for a specific term (i.e. token) is computed using the BM25 algorithm.
#       https://github.com/winkjs/wink-nlp
#       https://github.com/winkjs/wink-nlp-utils
#         https://winkjs.org/wink-nlp-utils/
#       https://github.com/winkjs/wink-distance

import argparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def calculate_similarities(main_file, other_files):
    documents = [read_file(main_file)] + [read_file(f) for f in other_files]
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(documents)
    main_doc_matrix = tfidf_matrix[0:1]
    similarities = cosine_similarity(main_doc_matrix, tfidf_matrix[1:])
    return list(zip(other_files, similarities.flatten()))

def main():
    parser = argparse.ArgumentParser(description="Calculate cosine similarity between a main file and a list of other files.")
    parser.add_argument("main_file", type=str, help="The main file to compare.")
    parser.add_argument("other_files", nargs='+', type=str, help="A list of other files to compare against the main file.")
    args = parser.parse_args()

    # Filter out the main file early if it's accidentally included in other_files
    filtered_files = [f for f in args.other_files if f != args.main_file]

    if not os.path.isfile(args.main_file):
        print(f"Error: '{args.main_file}' does not exist or is not a file.")
        return

    for file_path in filtered_files:
        if not os.path.isfile(file_path):
            print(f"Error: '{file_path}' does not exist or is not a file.")
            return

    results = calculate_similarities(args.main_file, filtered_files)
    sorted_results = sorted(results, key=lambda x: x[1], reverse=True)

    # for other_file, similarity in sorted_results:
    #     print(f"Similarity between {args.main_file} and {other_file}: {similarity:.4f}")

    print(f"Comparing against: {args.main_file}")
    for other_file, similarity in sorted_results:
        print(f"{other_file}: {similarity:.4f}")

if __name__ == "__main__":
    main()
