import bcrypt from "bcryptjs";

// salt(몇 번 해싱을 진행할것인지) + hash password
export function saltAndHashPassword(password: string): string {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    return hash;
}

// db의 비밀번호와 입력받은 비밀번호 비교해주는 함수
export function comparePassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
}