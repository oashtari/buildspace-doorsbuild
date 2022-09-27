LIB.RS

// 1. imports
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
};

// 11. make sure import other files
pub mod instruction;
use instruction::MovieInstruction;

// 3. start entrypoint
entrypoint!(process_instruction);

// 2. create entrypoint function
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // 9. after building instruction file, we can actually update this to have proper return
    let instruction = MovieInstruction::unpack(instruction_data)?;

    // if we get past that, as in, error is not returned, we can match on instruction
    match instruction {
        MovieInstruction::AddMovieReview {
            title,
            rating,
            description,
        } => {
            // this is where we finally do everything, which is executing the adding of a movie review
            // best to add another function for this as there'll eventually be many options for the match and it'll get messy
            // once function is created below, instead of using the Ok(()) we can just use this function here as it returns a program result,
            // which is what this function itself is expecting
            add_movie_review(program_id, accounts, title, rating, description)
        }
    }
}

// 4. create new file for instruction types, instruction.rs

// 10. add the function for match statement above
// will take same parameters as process instruction, plus some others
fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String,
) -> ProgramResult {
    // temp return instead of actual functionality
    msg!("Adding movie review");
    msg!("Title: {}", title);
    msg!("Rating: {}", rating);
    msg!("Description: {}", description);

    Ok(())
}

// 12. build
// 13. deploy
// 14. 2 ways we can test this, either a front-end, or a client side script
// with client side script, that James provided, just have to replace the program id in the main function
// then run npm start
// with front end, replace PROGRAM MOVIE REVIEW constant with program id
// do npm run dev, then test submitting a review

// If you need to reference solution code, have a look at this playground: https://beta.solpg.io/62aa9ba3b5e36a8f6716d45b

// For testing, feel free to use this script: https://github.com/Unboxed-Software/solana-movie-client

// Or this frontend: https://github.com/Unboxed-Software/solana-movie-frontend/tree/solution-update-reviews

INSTRUCTION.RS

// 5. imports
use Borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};

// 6. create enum 
pub enum MovieInstruction {
    AddMovieReview {
        title: String,
        rating: u8,
        description: String
    }
}

// 8. create impl for movie instruction so we have an unpack function 
impl MovieInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;

        // this will give us the payload as a movie review object
        let payload = MovieReviewPayload::try_from_slice(rest).unwrap();

        // return with a match on variant
        Ok(match variant {
            0 => Self::AddMovieReview{
                title: payload.title,
                rating: payload.rating,
                description: payload.description,
            },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
        
    }
}

// 7. need intermediate type to decode data && add the derive for deserialization
#[derive(BorshDeserialize)]
struct MovieReviewPayload {
    title: String,
    rating: u8,
    description: String
}


EXERCISE

solution code: https://beta.solpg.io/62b0ce53f6273245aca4f5b0

front-end code to test it https://github.com/Unboxed-Software/solana-student-intros-frontend/tree/solution-serialize-instruction-data