-- books테이블 컬럼명 변경 전, 데이터 추가 예시 
INSERT INTO books(title, category_id, `format`, summary, `description`, author, pages, isbn,`index`, price, published_date) 
	VALUES("어린왕자", 0, "종이책",
    "전 세계인들에게 사랑 받는 아름다운 이야기!

생텍쥐페리가 그린 어린왕자의 스케치 모음과 영화 속 명장면을 함께 담은 『어린 왕자』. 행성 B612호에서 온 한 어린아이가 바라본 지구별이란 여행지에 대한 단상을 모태로 하고 있지만 실상은 순수하기만 한 아이의 시선으로 보는 어른들의 세계를 은유로 풀어낸 작품이다.

생텍쥐페리의 섬세하고 시적인 운율을 간직한 프랑스어 원문을 그대로 살리는 정확한 번역으로 독자들에게 조금이나마 생텍쥐페리의 감성으로 다가가기 위해 심혈을 기울였다. 살면서 놓치고 있는 것은 무엇인지, 중요한 것은 무엇인지를 어린 시절 한번쯤을 읽었을 이 작품에서 보다 원전에 충실한 번역으로 다시 한 번 느낄 수 있을 것이다.",
"전 세계인들에게 가장 많은 사랑을 받은 아름다운 이야기 『어린 왕자』가 도서출판 솔에서 출간되었다. 특히, 생텍쥐페리의 섬세하고 시적인 운율을 간직한 프랑스어 원문을 그대로 살리는 정확한 번역으로 독자들에게 조금이나마 생텍쥐페리의 감성으로 다가가기 위해 심혈을 기울였다.

『어린 왕자』는 국내뿐만 아니라 전 세계적으로 많은 출판물을 가지고 있는데, 이번 솔의 『어린 왕자』는 가장 최신 번역판이면서 동시에 국내 12월 대 개봉을 앞둔 영화 《어린왕자》를 미리 볼 수 있는 기회를 제공한다. 책의 말미에 수록된 생텍쥐페리가 그린 수많은 어린왕자의 스케치모음과 영화 속 명장면은 이 작품에 감동을 더한다.

『어린 왕자』는 소행성 B612호에서 온 한 어린아이가 바라본 지구별이란 여행지에 대한 단상을 모태로 하고 있지만 실상은 순수하기만 한 아이의 시선으로 보는 어른들의 세계를 은유로 풀어내고 있다. 우리가 고전을 읽는 이유는 그때마다 새롭게 상처를 치유하고 위로받을 수 있기 때문이기도 하다. 살면서 놓치고 있는 것은 무엇인지, 중요한 것은 무엇인지를 어린 시절 한번쯤을 읽었을 이 작품에서 보다 원전에 충실한 번역으로 다시 한 번 느낄 수 있을 것이다.",
"생텍쥐페리", 200, "9791186634684",  
"어린 왕자 6
『어린 왕자』를 위해 생텍쥐페리가 그린 스케치 141
영화 《어린왕자》 명장면 167
옮긴이의 후기_해설 186
생테쥐페리와 어린 왕자 연보 196", 9900, "2015-11-20");

-- 예약어로 되어있는 컬럼명 변경
ALTER TABLE books CHANGE COLUMN `description` detail text; 

-- books테이블에 데이터 추가 예시
INSERT INTO books(title, category_id, form , summary, detail , author, pages, isbn,contents, price, published_date) 
values("javascript란?", 1, "ebook", "javascript 재밌다.", "javascript의 모든 것!", "kim", 300, "12341234123", "목차
javascript에 대해 배워보자.",2000, "2024-01-01"  );

--books 테이블의 description컬럼명을 detail로 변경, 데이터타입은 그대로 text
ALTER TABLE books CHANGE COLUMN `description` detail text; 

-- books 테이블의 category_id 컬럼을 FK로 설정하기
ALTER TABLE `BookShop`.`books` 
ADD CONSTRAINT `category_id`
  FOREIGN KEY (`category_id`)
  REFERENCES `BookShop`.`categories` (`id`)

-- likes 테이블에 데이터 추가
INSERT INTO likes(user_id, liked_book_id) VALUES(1,  1);

-- 좋아요 취소
DELETE FROM likes WHERE user_id=1 AND liked_book_id=1;

-- 중복된 레코드 삽입 방지하기 위해 (user_id, liked_book_id) 조합을 PK로 설정
ALTER TABLE likes ADD PRIMARY KEY (user_id, liked_book_id);

-- book_id가 3인 도서에 좋아요를 누른 갯수
SELECT count(*) AS liked_book_cnt FROM likes WHERE liked_book_id=3;

-- books테이블과 categories테이블을 JOIN해서 도서에 해당하는 카테고리 이름을 합친 테이블에,
-- 각 도서에 해당하는 좋아요 수(=likes)와 현재 사용자가 해당 도서를 좋아요 눌렀는지에 대한 정보(=is_liked)에 대한 컬럼을 생성한 테이블을 출력 
SELECT b.*, c.category_name,
      (SELECT COUNT(*) FROM likes WHERE liked_book_id = b.id) AS likes,
      EXISTS (SELECT 1 FROM likes WHERE user_id = 1 AND liked_book_id = 1) AS is_liked
FROM books AS b INNER JOIN categories AS c USING (category_id)
WHERE b.id = 1;

-- 장바구니에 데이터 삽입
INSERT INTO cart_items (user_id, book_id, quantity) VALUES(1, 1, 2);